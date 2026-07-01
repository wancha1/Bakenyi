export interface SearchItem {
  id: string;
  category: 'Clan' | 'Leader' | 'History Timeline' | 'Oral History' | 'Article';
  title: string;
  subtitle: string;
  description: string;
  targetPath: string; // The URL path to navigate to, e.g. /clans?q=BaiseMugosa
}

export const searchDatabase: SearchItem[] = [
  // Clans
  {
    id: "clan-mugosa",
    category: "Clan",
    title: "BaiseMugosa",
    subtitle: "Totem: Leopard (Egoonzu) • Strength & Swiftness",
    description: "One of the largest clans, traditionally known for their leadership and tactical skills.",
    targetPath: "/clans?q=BaiseMugosa"
  },
  {
    id: "clan-igoola",
    category: "Clan",
    title: "BaiseIgoola",
    subtitle: "Totem: Egrets (Ennyaange) • Purity & Unity",
    description: "Known for their diplomatic skills and mediating conflicts within the community.",
    targetPath: "/clans?q=BaiseIgoola"
  },
  {
    id: "clan-musuusu",
    category: "Clan",
    title: "BaiseMusuusu",
    subtitle: "Totem: Bird (Enfulu) • Resourcefulness",
    description: "Experts in navigating the complex waterways of Lake Kyoga.",
    targetPath: "/clans?q=BaiseMusuusu"
  },
  {
    id: "clan-munana",
    category: "Clan",
    title: "BaiseMunana",
    subtitle: "Totem: Colobus Monkey • Wisdom of the Tree",
    description: "Historically provided many of the community's advisors and storytellers.",
    targetPath: "/clans?q=BaiseMunana"
  },
  {
    id: "clan-kiingi",
    category: "Clan",
    title: "BaiseKiingi",
    subtitle: "Totem: Lion • Royalty & Courage",
    description: "A clan with deep roots in the original leadership structures of the Bakenyi people.",
    targetPath: "/clans?q=BaiseKiingi"
  },
  {
    id: "clan-muduma",
    category: "Clan",
    title: "BaiseMuduma",
    subtitle: "Totem: Hippopotamus • Power over Water",
    description: "Respected for their bravery in protecting the floating islands from threats.",
    targetPath: "/clans?q=BaiseMuduma"
  },
  {
    id: "clan-nume",
    category: "Clan",
    title: "BaiseNume",
    subtitle: "Totem: Bull • Stability & Wealth",
    description: "Known for their early adoption of land-based agriculture alongside fishing.",
    targetPath: "/clans?q=BaiseNume"
  },
  {
    id: "clan-mpina",
    category: "Clan",
    title: "BaiseMpina",
    subtitle: "Totem: Fish (Emputa) • Sustenance",
    description: "The masters of the net; traditionally the most successful fishers in the Kyoga basin.",
    targetPath: "/clans?q=BaiseMpina"
  },

  // Leaders
  {
    id: "leader-moses",
    category: "Leader",
    title: "Elder Moses Musuusu",
    subtitle: "Chairman, Cultural Council • Oral History & Genealogy",
    description: "A retired educator with 40 years of experience in documenting Lukenye oral traditions and clan lineages.",
    targetPath: "/leadership?q=Moses"
  },
  {
    id: "leader-sarah",
    category: "Leader",
    title: "Dr. Sarah Igalu",
    subtitle: "Secretary, Heritage Committee • Linguistics & Archiving",
    description: "Linguistics expert focusing on the preservation of endangered Bantu dialects in the Lake Kyoga basin.",
    targetPath: "/leadership?q=Sarah"
  },
  {
    id: "leader-james",
    category: "Leader",
    title: "Hon. James Mugosa",
    subtitle: "Community Liaison • Policy & Community Organizing",
    description: "Advocates for the social and cultural rights of the Bakenyi people at the regional and national levels.",
    targetPath: "/leadership?q=James"
  },
  {
    id: "leader-esther",
    category: "Leader",
    title: "Mrs. Esther Kiingi",
    subtitle: "Director of Cultural Arts • Music & Performing Arts",
    description: "Promoter of traditional Bakenyi music and dance, ensuring these art forms are taught in local schools.",
    targetPath: "/leadership?q=Esther"
  },

  // History timeline events
  {
    id: "history-roots",
    category: "History Timeline",
    title: "Ancient Roots & Migration (15th - 16th Century)",
    subtitle: "Chronicles of Bakenyi origin",
    description: "The Bakenyi precursors evolved from the wider Bantu-speaking groups around Lake Victoria and the Bunyoro-Kitara Empire.",
    targetPath: "/history?section=roots"
  },
  {
    id: "history-islands",
    category: "History Timeline",
    title: "Establishment on Floating Islands (17th Century)",
    subtitle: "Ebiswa and adaptation to Lake Kyoga",
    description: "The Bakenyi became famous for living on 'Ebiswa' (floating islands formed by papyrus) for natural defense.",
    targetPath: "/history?section=islands"
  },
  {
    id: "history-expansion",
    category: "History Timeline",
    title: "Regional Expansion (18th - 19th Century)",
    subtitle: "Spreading through Paliisa, Kamuli, and Budaka",
    description: "Establishing relationships with the Baganda, Basoga, and Bagwere while maintaining a distinct linguistic identity.",
    targetPath: "/history?section=expansion"
  },
  {
    id: "history-colonial",
    category: "History Timeline",
    title: "Administrative Recognition (1900s - Colonial)",
    subtitle: "Protectorate records and land settlement",
    description: "Formal recording of Bakenyi as a distinct ethnic group. Settlement patterns moved more towards stable land-based villages.",
    targetPath: "/history?section=colonial"
  },

  // Oral History tracks
  {
    id: "oral-floating",
    category: "Oral History",
    title: "The Legend of the Floating Islands (Ebiswa)",
    subtitle: "Narrated by Mzee Yosefu Mwula (Abakenge Clan)",
    description: "A traditional wooden canoe at sunset, reflecting the Bakenyi's deep connection to the floating islands of Lake Kyoga.",
    targetPath: "/history?track=track-1"
  },
  {
    id: "oral-preservation",
    category: "Oral History",
    title: "Secrets of Lukenye Language Preservation",
    subtitle: "Narrated by Mama Grace Namutosi (Abasenyi Clan)",
    description: "Intricate patterns and linguistic history passed down through generations.",
    targetPath: "/history?track=track-2"
  },
  {
    id: "oral-totems",
    category: "Oral History",
    title: "Clan Totems & Sacred Water Spirits",
    subtitle: "Narrated by Mzee Peter Mukama (Abagaya Clan)",
    description: "Sacred customs defining the Bakenyi's harmonious co-existence with Lake Kyoga and the lungfish totem.",
    targetPath: "/history?track=track-3"
  },
  {
    id: "oral-crafting",
    category: "Oral History",
    title: "Traditional Canoe Crafting Techniques",
    subtitle: "Narrated by Mzee Kadhiri Waako (Abanyele Clan)",
    description: "Carving traditional canoes is a sacred lineage craft Bakenyi master boatbuilders inherited from ancestors.",
    targetPath: "/history?track=track-4"
  },
  // Articles
  {
    id: "article-migration",
    category: "Article",
    title: "The Migration of the Bakenyi: A 500-Year Voyage",
    subtitle: "By Elder Moses Musuusu • History",
    description: "Trace the epic historical migration of the Bakenyi people from Mount Elgon to the floating islands of Lake Kyoga.",
    targetPath: "/articles/migration-kyoga-basin"
  },
  {
    id: "article-lukenye",
    category: "Article",
    title: "Preserving the Lukenye Language: Challenges & Modern Revitalization",
    subtitle: "By Dr. Sarah Igalu • Culture",
    description: "As one of Uganda's most endangered Bantu languages, Lukenye holds the soul of Bakenyi oral history.",
    targetPath: "/articles/lukenye-language-initiatives"
  },
  {
    id: "article-ebiswa",
    category: "Article",
    title: "The Engineering of Ebiswa: Lake Kyoga's Ancient Floating Structures",
    subtitle: "By Mzee Peter Mukama • Heritage",
    description: "Explore the sophisticated environmental engineering behind Bakenyi floating islands and the construction techniques used to build durable aquatic homes.",
    targetPath: "/articles/science-floating-islands"
  },
  {
    id: "article-fisheries",
    category: "Article",
    title: "Kyoga Fisheries Cooperative Launches Sustainable Fishing Guidelines",
    subtitle: "By Hon. James Mugosa • Community News",
    description: "In a bid to combat overfishing and preserve Lake Kyoga's biodiversity, the local Bakenyi fishing cooperative introduces traditional ecological zoning.",
    targetPath: "/articles/cooperative-fisheries-news"
  },
  {
    id: "article-festival",
    category: "Article",
    title: "Bakenyi Cultural Heritage Festival 2026: Schedule & Highlights",
    subtitle: "By Mrs. Esther Kiingi • Announcements",
    description: "The annual celebration of Bakenyi culture returns to the shores of Paliisa District with canoe racing and cultural displays.",
    targetPath: "/articles/kyoga-festival-2026"
  }
];
