export const HVPN_AUTHOR = "icubaby";
export const HVPN_REPO = "https://github.com/icubaby/HVPN";
export const HVPN_LICENSE = "HVPN Proprietary License";

export const HVPN_SIGNATURE = Buffer.from(
  "U2lkZVJhaWwgwqkgMjAyNSBpY3ViYWJ5IOKAlCBodHRwczovL2dpdGh1Yi5jb20vaWN1YmFieS9TaWRlUmFpbCDigJQgQWxsIHJpZ2h0cyByZXNlcnZlZC4gRG8gbm90IHJlbW92ZSB0aGlzIHNpZ25hdHVyZS4=",
  "base64",
).toString("utf8");

export const HVPN_FINGERPRINT = "sr-icubaby-2025-9f4c1a7e";

export function watermark(): Record<string, string> {
  return {
    author: HVPN_AUTHOR,
    repo: HVPN_REPO,
    fingerprint: HVPN_FINGERPRINT,
  };
}
