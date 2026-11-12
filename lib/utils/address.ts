/** Thai postal order: address line · sub-district + district · province + postcode (D-24). */
export function formatAddressLines(a: {
  address_line: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
}): string[] {
  return [a.address_line, `${a.subdistrict} ${a.district}`, `${a.province} ${a.postal_code}`];
}
