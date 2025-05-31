import { BASE_URL } from "@/constants/config";
import axios from "axios";

export default async function updateSheet({
  id,
  ...rest
}: {
  name: string;
  id: string | number;
}) {
  const { data } = await axios.patch(`${BASE_URL}/api/sheets/${id}`, rest);
  return data as boolean;
}
