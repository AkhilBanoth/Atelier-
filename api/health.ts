interface VercelResponseLike {
  status: (code: number) => VercelResponseLike;
  json: (payload: unknown) => void;
}

export default function handler(_req: unknown, res: VercelResponseLike) {
  return res.status(200).json({ ok: true });
}
