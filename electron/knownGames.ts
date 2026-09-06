/**
 * Lista curada de ejecutables de juegos y lanzadores conocidos, usada como
 * heurística de detección. No pretende ser exhaustiva: se complementa con la
 * detección de "ventana en primer plano a pantalla completa" en gameDetector.ts.
 */
export const KNOWN_GAME_PROCESSES: Record<string, string> = {
  'valorant.exe': 'Valorant',
  'valorant-win64-shipping.exe': 'Valorant',
  'league of legends.exe': 'League of Legends',
  'leagueclient.exe': 'League of Legends',
  'csgo.exe': 'Counter-Strike',
  'cs2.exe': 'Counter-Strike 2',
  'dota2.exe': 'Dota 2',
  'fortniteclient-win64-shipping.exe': 'Fortnite',
  'gta5.exe': 'GTA V',
  'gtav.exe': 'GTA V',
  'r5apex.exe': 'Apex Legends',
  'overwatch.exe': 'Overwatch 2',
  'rainbowsix.exe': 'Rainbow Six Siege',
  'rocketleague.exe': 'Rocket League',
  'eldenring.exe': 'Elden Ring',
  'cyberpunk2077.exe': 'Cyberpunk 2077',
  'witcher3.exe': 'The Witcher 3',
  'minecraft.exe': 'Minecraft',
  'javaw.exe': 'Minecraft (Java)',
  'robloxplayerbeta.exe': 'Roblox',
  'warzone.exe': 'Call of Duty: Warzone',
  'blackops6.exe': 'Call of Duty: Black Ops 6',
  'destiny2.exe': 'Destiny 2',
  'starcraft ii.exe': 'StarCraft II',
  'wow.exe': 'World of Warcraft',
  'palworld.exe': 'Palworld',
  'starfield.exe': 'Starfield',
  'pubg.exe': 'PUBG',
  'tslgame.exe': 'PUBG'
};

export function lookupGameName(processNameLower: string): string | null {
  return KNOWN_GAME_PROCESSES[processNameLower] ?? null;
}
