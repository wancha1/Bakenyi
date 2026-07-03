# Security Specification & Test-Driven Development Plan

This specification outlines the data invariants, threat payloads ("Dirty Dozen"), and the test definitions to secure our Firebase-based Bakenyi Heritage Content Management System.

## 1. Data Invariants

1. **Role Hierarchies and Controls**:
   - `super_admin`: Can manage users, assign roles, and perform all read/write actions on all collections (`users`, `news`, `blogs`, `vlogs`, `gallery`, `categories`).
   - `admin`: Can create, edit, delete and publish news/blogs (`news`, `blogs`), manage `categories`, and upload images. Cannot manage users/roles.
   - `editor`: Can create and edit news/blogs (`news`, `blogs`), save as `draft`, or submit for review (`status: "pending"`). Cannot delete content or change status directly to `published`.
   - `reporter`: Can only create news/blogs (`news`, `blogs`), save as `draft` only, and upload photos. Cannot submit for review, delete, or publish.
   - User roles can only be updated/assigned by a `super_admin`.

2. **Creation Constraints**:
   - Every `news` or `blogs` write must have a matching `authorId` equal to the logged-in user's UID (unless the write is by `super_admin`).
   - Every item's `createdAt` or `updatedAt` field must align strictly with `request.time` (no client-side overrides).

3. **Immutable Fields**:
   - Once a document is created in `news`, `blogs`, `vlogs`, `gallery`, or `categories`, its `createdAt` and `authorId` (or `createdBy`) fields are immutable and cannot be changed.

4. **Terminal States**:
   - A `published` article cannot be modified or reverted to `draft` by a `reporter`. Only `editor`, `admin`, and `super_admin` can manage published states or review requests.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent malicious attempts to bypass identity, integrity, or role boundary protections in the client SDK.

### 1. Self-Assigned Privilege Escalation
An unprivileged user tries to register or update their user profile doc directly with the `super_admin` role.
```json
// Target: /users/attacker_uid
{
  "uid": "attacker_uid",
  "email": "attacker@gmail.com",
  "displayName": "Malicious Attacker",
  "role": "super_admin"
}
```

### 2. Reporter Direct Publication
A Reporter tries to create or update an article with `status: "published"`, bypassing editor/admin approvals.
```json
// Target: /news/malicious-article
{
  "title": "Unauthorized Leak",
  "slug": "unauthorized-leak",
  "summary": "This should not be published",
  "content": "Secret content",
  "authorId": "reporter_uid",
  "status": "published",
  "createdAt": "request.time"
}
```

### 3. Editor Direct Publication
An Editor tries to bypass Admin review and publish an article directly.
```json
// Target: /news/editor-leak
{
  "title": "Editor Direct Publish",
  "slug": "editor-leak",
  "summary": "Bypassing admin review",
  "content": "Rich content...",
  "authorId": "editor_uid",
  "status": "published",
  "createdAt": "request.time"
}
```

### 4. Anonymous Write Attempt
An unauthenticated user tries to write a new category.
```json
// Target: /categories/hacking
{
  "name": "Hack Category",
  "slug": "hacking",
  "createdAt": "request.time"
}
```

### 5. PII Database Scraping
An authenticated standard user tries to list or read another user's private profile document containing PII (email, display name).
```json
// GET /users/victim_uid
{}
```

### 6. ID Poisoning Guard
An attacker attempts to write a document with an extremely long or path-traversing ID.
```json
// Target: /news/../../../etc/passwd
{
  "title": "ID Poisoning Attack",
  "slug": "id-poison",
  "summary": "Hacking pathing",
  "content": "Hacked",
  "authorId": "attacker_uid",
  "status": "draft",
  "createdAt": "request.time"
}
```

### 7. Denial-of-Wallet Payload Size Attack
An attacker tries to upload a massive string (e.g. 5MB) into a `title` or `content` field to exhaust resources.
```json
// Target: /news/huge-article
{
  "title": "A".repeat(100000), // Exceeding text size limit
  "slug": "huge-article",
  "summary": "Too big",
  "content": "A".repeat(10000000),
  "authorId": "attacker_uid",
  "status": "draft",
  "createdAt": "request.time"
}
```

### 8. Identity Impersonation (Owner Spoofing)
A user signs in as `reporter_uid` but attempts to write an article with `authorId` set to a different user `editor_uid` to bypass authorship tracking.
```json
// Target: /news/impersonated-article
{
  "title": "Spoofed Author",
  "slug": "impersonated-article",
  "summary": "Not mine",
  "content": "Spoofed",
  "authorId": "editor_uid", // Spoofed!
  "status": "draft",
  "createdAt": "request.time"
}
```

### 9. State Shortcutting / Reporter Overwriting
A Reporter attempts to edit/overwrite a previously published article.
```json
// Target: /news/previously-published-article
{
  "title": "Hacked Title",
  "status": "published",
  "updatedAt": "request.time"
}
```

### 10. Immutable Field Corruption
A user tries to edit an article and change its original `createdAt` date to a historical date.
```json
// Target: /news/existing-article
{
  "createdAt": "2000-01-01T00:00:00Z", // Immutable change!
  "updatedAt": "request.time"
}
```

### 11. Client-Side Timestamp Manipulation
A user tries to set the creation time using a custom future/past client-supplied date instead of `request.time`.
```json
// Target: /news/new-article
{
  "title": "Bad Date",
  "slug": "bad-date",
  "summary": "Bad date",
  "content": "Content",
  "authorId": "reporter_uid",
  "status": "draft",
  "createdAt": "2030-01-01T00:00:00Z" // Invalid, must be server timestamp!
}
```

### 12. List Scraping Without Filter Checks
A user tries to query `/news` using standard client SDK queries without filtering by approved state or their own author id (unauthorized collection scan).
```json
// LIST /news without author filters or status == "published"
{}
```

---

## 3. Test Definitions for Threat Mitigation

These tests run on the local Firestore Emulator or test suite to ensure that all "Dirty Dozen" operations result in `PERMISSION_DENIED`.

```typescript
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

describe('Bakenyi CMS Security Rules Unit Tests', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'bakenyi-heritage-app',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('1. Blocks self-assigned Super Admin role on creation', async () => {
    const unprivilegedContext = testEnv.authenticatedContext('user_123', {
      email: 'user@bakenyi.org',
      email_verified: true,
    });
    const db = unprivilegedContext.firestore();
    
    // Attacker tries to make themselves super_admin
    await assertFails(
      db.doc('users/user_123').set({
        uid: 'user_123',
        email: 'user@bakenyi.org',
        role: 'super_admin',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('2. Blocks Reporter from publishing an article directly', async () => {
    // Setup user profile as reporter
    const adminContext = testEnv.authenticatedContext('super_admin', { email: 'wanchaaaron@gmail.com', email_verified: true });
    await adminContext.firestore().doc('users/reporter_user').set({
      uid: 'reporter_user',
      email: 'reporter@bakenyi.org',
      role: 'reporter',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const reporterContext = testEnv.authenticatedContext('reporter_user', {
      email: 'reporter@bakenyi.org',
      email_verified: true,
    });
    
    await assertFails(
      reporterContext.firestore().doc('news/art_1').set({
        title: 'Reporter Published',
        slug: 'reporter-published',
        summary: 'Should fail',
        content: 'Content',
        authorId: 'reporter_user',
        status: 'published', // Fails! Reporter can only write status == "draft"
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('3. Blocks Editor from publishing directly', async () => {
    // Setup editor
    const adminContext = testEnv.authenticatedContext('super_admin', { email: 'wanchaaaron@gmail.com', email_verified: true });
    await adminContext.firestore().doc('users/editor_user').set({
      uid: 'editor_user',
      email: 'editor@bakenyi.org',
      role: 'editor',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const editorContext = testEnv.authenticatedContext('editor_user', {
      email: 'editor@bakenyi.org',
      email_verified: true,
    });

    await assertFails(
      editorContext.firestore().doc('news/art_2').set({
        title: 'Editor Published',
        slug: 'editor-published',
        summary: 'Should fail',
        content: 'Content',
        authorId: 'editor_user',
        status: 'published', // Fails! Editor can only write "draft" or "pending"
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('4. Blocks Anonymous writes completely across collections', async () => {
    const anonContext = testEnv.unauthenticatedContext();
    await assertFails(
      anonContext.firestore().doc('categories/new_cat').set({
        name: 'Anonymous Category',
        slug: 'anon',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('5. Prevents PII leaks by blocking general users from reading other user profiles', async () => {
    const aliceContext = testEnv.authenticatedContext('alice', { email: 'alice@bakenyi.org', email_verified: true });
    const bobContext = testEnv.authenticatedContext('bob', { email: 'bob@bakenyi.org', email_verified: true });

    // Alice registers Bob's profile
    await bobContext.firestore().doc('users/bob').set({
      uid: 'bob',
      email: 'bob@bakenyi.org',
      role: 'reporter',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Alice tries to read Bob's profile
    await assertFails(aliceContext.firestore().doc('users/bob').get());
  });

  it('6. Blocks path traversal and ID poisoning attempts', async () => {
    const reporterContext = testEnv.authenticatedContext('reporter_user', { email: 'reporter@bakenyi.org', email_verified: true });
    
    await assertFails(
      reporterContext.firestore().doc('news/invalid-id-containing-slashes/../../../pass').set({
        title: 'Jailbreak',
        slug: 'jailbreak',
        status: 'draft',
        authorId: 'reporter_user',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('7. Blocks massive content inputs (Denial-of-Wallet prevention)', async () => {
    const reporterContext = testEnv.authenticatedContext('reporter_user', { email: 'reporter@bakenyi.org', email_verified: true });
    
    await assertFails(
      reporterContext.firestore().doc('news/huge_article').set({
        title: 'A'.repeat(500), // Exceeds size limits
        slug: 'huge',
        summary: 'Summary',
        content: 'Content',
        authorId: 'reporter_user',
        status: 'draft',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('8. Prevents identity impersonation (Owner spoofing)', async () => {
    const reporterContext = testEnv.authenticatedContext('reporter_user', { email: 'reporter@bakenyi.org', email_verified: true });
    
    await assertFails(
      reporterContext.firestore().doc('news/spoofed').set({
        title: 'Spoofed Article',
        slug: 'spoofed',
        summary: 'Summary',
        content: 'Content',
        authorId: 'some_other_user_id', // Spoofed! Should match reporter_user
        status: 'draft',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
    );
  });

  it('9. Blocks Reporter from overwriting published content', async () => {
    const reporterContext = testEnv.authenticatedContext('reporter_user', { email: 'reporter@bakenyi.org', email_verified: true });
    
    // Seed a published article as admin
    const adminContext = testEnv.authenticatedContext('super_admin', { email: 'wanchaaaron@gmail.com', email_verified: true });
    await adminContext.firestore().doc('news/pub_art').set({
      title: 'Published',
      slug: 'pub',
      summary: 'Summary',
      content: 'Content',
      authorId: 'reporter_user',
      status: 'published',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Reporter tries to modify it
    await assertFails(
      reporterContext.firestore().doc('news/pub_art').update({
        title: 'Hacked Published',
      })
    );
  });

  it('10. Blocks updating immutable fields like createdAt', async () => {
    const reporterContext = testEnv.authenticatedContext('reporter_user', { email: 'reporter@bakenyi.org', email_verified: true });
    const db = reporterContext.firestore();

    await db.doc('news/art_4').set({
      title: 'My Article',
      slug: 'my-art',
      summary: 'Summary',
      content: 'Content',
      authorId: 'reporter_user',
      status: 'draft',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Attempt to update createdAt
    await assertFails(
      db.doc('news/art_4').update({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Fails since it must not be updated or changed
      })
    );
  });

  it('11. Rejects non-server client-supplied timestamps', async () => {
    const reporterContext = testEnv.authenticatedContext('reporter_user', { email: 'reporter@bakenyi.org', email_verified: true });
    
    await assertFails(
      reporterContext.firestore().doc('news/bad_date').set({
        title: 'Bad Date',
        slug: 'bad-date',
        summary: 'Summary',
        content: 'Content',
        authorId: 'reporter_user',
        status: 'draft',
        createdAt: '2030-01-01T00:00:00Z', // Client supplied date instead of serverTimestamp()
      })
    );
  });

  it('12. Rejects listing documents without matching parameters', async () => {
    const unauthorizedContext = testEnv.authenticatedContext('random_user', { email: 'unauthorized@gmail.com', email_verified: true });
    
    // Attempt to list drafts without filters (which would list everything)
    await assertFails(
      unauthorizedContext.firestore().collection('news').get()
    );
  });
});
```
