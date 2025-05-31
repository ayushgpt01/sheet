import { BASE_URL } from "@/constants/config";
import axios from "axios";

export default async function deleteSheet(id: string | number) {
  const { data } = await axios.delete(`${BASE_URL}/api/sheets/${id}`);
  return data as boolean;
}
