import { BASE_URL } from "@/constants/config";
import axios from "axios";

export default async function duplicateSheet(id: string | number) {
  const { data } = await axios.post(`${BASE_URL}/api/sheets/${id}/duplicate`);
  return data as SheetsListItem;
}
