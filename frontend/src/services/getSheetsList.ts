import { BASE_URL } from "@/constants/config";
import axios from "axios";

export default async function getSheetsList() {
  const { data } = await axios.get(`${BASE_URL}/api/sheets`);
  return data as SheetsListItem[];
}
