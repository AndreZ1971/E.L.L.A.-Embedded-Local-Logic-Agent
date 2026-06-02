import { MsEdgeTTS, MetadataOptions, OUTPUT_FORMAT } from "msedge-tts";

const DEFAULT_VOICE = "de-DE-KatjaNeural";

let _tts: MsEdgeTTS | null = null;

function getTTS(): MsEdgeTTS {
  if (!_tts) _tts = new MsEdgeTTS();
  return _tts;
}

export interface TTSOptions {
  voice?: string;
  rate?: string;
  pitch?: string;
}

export async function synthesize(
  text: string,
  options: TTSOptions = {},
): Promise<Buffer> {
  const tts = getTTS();
  const rawVoice = options.voice?.trim() ?? "";
  // msedge-tts requires ShortName format: "de-DE-KatjaNeural"
  // Windows SAPI names like "Microsoft Katja - German (Germany)" are not valid here
  const voice = /^[a-z]{2}-[A-Z]{2}-.+/.test(rawVoice)
    ? rawVoice
    : DEFAULT_VOICE;
  const locale = voice.split("-").slice(0, 2).join("-");

  const metadataOptions = new MetadataOptions();
  metadataOptions.voiceLocale = locale;

  await tts.setMetadata(
    voice,
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3,
    metadataOptions,
  );

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const { audioStream } = tts.toStream(text);
    audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
    audioStream.on("end", () => resolve(Buffer.concat(chunks)));
    audioStream.on("error", reject);
  });
}

export async function listVoices(): Promise<
  Array<{ name: string; locale: string; gender: string }>
> {
  const tts = getTTS();
  const voices = await tts.getVoices();
  return voices
    .filter((v) => v.Locale.startsWith("de"))
    .map((v) => ({
      name: v.ShortName,
      locale: v.Locale,
      gender: v.Gender,
    }));
}
