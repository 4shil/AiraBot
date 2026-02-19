// Social media integration
export async function getInstagramReels(trending: boolean = true): Promise<string[]> {
  return ["reel_url_1", "reel_url_2"];
}

export async function checkSnapStreaks(): Promise<Array<{ friend: string; days: number }>> {
  return [{ friend: "John", days: 45 }];
}

export async function getDiscordStatus(userId: string): Promise<string> {
  return "Online - Playing BGMI";
}
