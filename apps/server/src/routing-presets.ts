export interface RoutingPreset {
  id: string;
  label: string;
  kind: "domain" | "ip";
  values: string[];
}

export const COUNTRY_IP_PRESETS: RoutingPreset[] = [
  { id: "geoip:private", label: "Private IPs", kind: "ip", values: ["geoip:private"] },
  { id: "geoip:ir", label: "Iran", kind: "ip", values: ["geoip:ir"] },
  { id: "geoip:cn", label: "China", kind: "ip", values: ["geoip:cn"] },
  { id: "geoip:ru", label: "Russia", kind: "ip", values: ["geoip:ru"] },
  { id: "geoip:vn", label: "Vietnam", kind: "ip", values: ["geoip:vn"] },
  { id: "geoip:es", label: "Spain", kind: "ip", values: ["geoip:es"] },
  { id: "geoip:us", label: "United States", kind: "ip", values: ["geoip:us"] },
  { id: "geoip:de", label: "Germany", kind: "ip", values: ["geoip:de"] },
  { id: "geoip:gb", label: "United Kingdom", kind: "ip", values: ["geoip:gb"] },
  { id: "geoip:fr", label: "France", kind: "ip", values: ["geoip:fr"] },
  { id: "geoip:tr", label: "Turkey", kind: "ip", values: ["geoip:tr"] },
  { id: "geoip:ae", label: "UAE", kind: "ip", values: ["geoip:ae"] },
  { id: "geoip:nl", label: "Netherlands", kind: "ip", values: ["geoip:nl"] },
  { id: "geoip:in", label: "India", kind: "ip", values: ["geoip:in"] },
  { id: "geoip:jp", label: "Japan", kind: "ip", values: ["geoip:jp"] },
  { id: "geoip:sg", label: "Singapore", kind: "ip", values: ["geoip:sg"] },
  { id: "geoip:ca", label: "Canada", kind: "ip", values: ["geoip:ca"] },
  { id: "geoip:br", label: "Brazil", kind: "ip", values: ["geoip:br"] },
];

export const DOMAIN_PRESETS: RoutingPreset[] = [
  { id: "geosite:category-ads-all", label: "Ads & Trackers (all)", kind: "domain", values: ["geosite:category-ads-all"] },
  { id: "geosite:category-porn", label: "Adult / +18", kind: "domain", values: ["geosite:category-porn"] },
  { id: "geosite:category-games", label: "Games", kind: "domain", values: ["geosite:category-games"] },
  { id: "geosite:category-social-media", label: "Social media", kind: "domain", values: ["geosite:category-social-media"] },
  { id: "geosite:speedtest", label: "Speed tests", kind: "domain", values: ["geosite:speedtest"] },
  { id: "geosite:bittorrent", label: "Torrent / BitTorrent", kind: "domain", values: ["geosite:bittorrent"] },
  { id: "geosite:google", label: "Google", kind: "domain", values: ["geosite:google"] },
  { id: "geosite:youtube", label: "YouTube", kind: "domain", values: ["geosite:youtube"] },
  { id: "geosite:facebook", label: "Facebook", kind: "domain", values: ["geosite:facebook"] },
  { id: "geosite:instagram", label: "Instagram", kind: "domain", values: ["geosite:instagram"] },
  { id: "geosite:twitter", label: "X / Twitter", kind: "domain", values: ["geosite:twitter"] },
  { id: "geosite:tiktok", label: "TikTok", kind: "domain", values: ["geosite:tiktok"] },
  { id: "geosite:telegram", label: "Telegram", kind: "domain", values: ["geosite:telegram"] },
  { id: "geosite:whatsapp", label: "WhatsApp", kind: "domain", values: ["geosite:whatsapp"] },
  { id: "geosite:netflix", label: "Netflix", kind: "domain", values: ["geosite:netflix"] },
  { id: "geosite:disney", label: "Disney+", kind: "domain", values: ["geosite:disney"] },
  { id: "geosite:spotify", label: "Spotify", kind: "domain", values: ["geosite:spotify"] },
  { id: "geosite:openai", label: "OpenAI / ChatGPT", kind: "domain", values: ["geosite:openai"] },
  { id: "geosite:twitch", label: "Twitch", kind: "domain", values: ["geosite:twitch"] },
  { id: "geosite:reddit", label: "Reddit", kind: "domain", values: ["geosite:reddit"] },
  { id: "geosite:amazon", label: "Amazon", kind: "domain", values: ["geosite:amazon"] },
  { id: "geosite:apple", label: "Apple", kind: "domain", values: ["geosite:apple"] },
  { id: "geosite:microsoft", label: "Microsoft", kind: "domain", values: ["geosite:microsoft"] },
];

export const ALL_PRESETS = [...DOMAIN_PRESETS, ...COUNTRY_IP_PRESETS];
