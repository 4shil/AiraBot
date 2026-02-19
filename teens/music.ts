// Music integration
export async function playSpotify(query: string): Promise<string> {
  return `Playing: ${query} on Spotify`;
}

export async function getMalayalamPlaylist(): Promise<string[]> {
  return ["Manike", "Kaavaalaa", "Jimikki Kammal"];
}
