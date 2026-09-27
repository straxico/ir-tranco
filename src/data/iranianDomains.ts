import categories from "./categories.json";
import { CategoryItem } from "../types/domain";
export const CATEGORIES: CategoryItem[] = [
  ...categories,
  {
    id: "uncategorized",
    nameFa: "دسته‌بندی‌نشده",
    nameEn: "Uncategorized",
    icon: "Globe",
    descriptionFa: "دامنه‌های فهرست عمومی که هنوز دسته‌بندی نشده‌اند",
    domainCount: 0,
    topDomain: "",
  },
];
