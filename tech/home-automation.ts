// Home automation
export async function toggleLight(roomId: string, state: boolean): Promise<string> {
  return `Light in ${roomId} ${state ? "ON" : "OFF"}`;
}

export async function setAC(roomId: string, temp: number): Promise<string> {
  return `AC in ${roomId} set to ${temp}°C`;
}

export async function getDeviceStatus(): Promise<Array<{ device: string; status: string }>> {
  return [
    { device: "Living Room Light", status: "ON" },
    { device: "Bedroom AC", status: "24°C" },
  ];
}
