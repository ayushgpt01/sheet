import { BASE_URL } from "@/constants/config";
import axios from "axios";

export default async function getSheet({ id }: { id: number }) {
  const { data } = await axios.get(`${BASE_URL}/api/sheets/${id}`);
  return data as Sheet;
}
