import { BASE_URL } from "@/constants/config";
import axios from "axios";

export default async function getGrid() {
  const { data } = await axios.get(`${BASE_URL}/api/grid`);
  return data as Grid;
}
