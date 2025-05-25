import { BASE_URL } from "@/constants/config";
import axios from "axios";

export default async function createSheet(params: {
  name: number;
  row_count?: number;
  col_count?: number;
}) {
  const { data } = await axios.post(`${BASE_URL}/api/sheets`, params);
  return data as SheetsListItem;
}
