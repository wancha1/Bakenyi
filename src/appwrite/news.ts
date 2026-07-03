import { databases, DATABASE_ID, COLLECTION_NEWS } from "./config";
import { ID } from "appwrite";

const DB_ID = DATABASE_ID || "bakenye_db";
const COLL_ID = COLLECTION_NEWS || "news";

export const createNews = async (data: any, user: any) => {
  return await databases.createDocument(
    DB_ID,
    COLL_ID,
    ID.unique(),
    {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: data.content,
      category: data.category,
      status: "draft",
      authorId: user?.$id || "anonymous",
      createdAt: new Date().toISOString()
    }
  );
};

export const getNews = async () => {
  return await databases.listDocuments(
    DB_ID,
    COLL_ID
  );
};
