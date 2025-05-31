import { BASE_URL } from "@/constants/config";
import axios from "axios";

interface Params {
  sheetId: number;
  cellId: number;
  value?: string;
  formula?: string;
}

export default async function updateSheetCell({
  cellId,
  sheetId,
  ...params
}: Params) {
  const { data } = await axios.patch(
    `${BASE_URL}/api/sheets/${sheetId}/cell/${cellId}`,
    params
  );
  return data as boolean;
}
