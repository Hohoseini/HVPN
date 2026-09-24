export const SIDERAIL_AUTHOR = "Hohoseini";
export const SIDERAIL_REPO = "https://github.com/Hohoseini/HVPN";
export const SIDERAIL_LICENSE = "hvpn Proprietary License";

export const SIDERAIL_SIGNATURE = Buffer.from(
  "U2lkZVJhaWwgwqkgMjAyNSBpY3ViYWJ5IOKAlCBodHRwczovL2dpdGh1Yi5jb20vaWN1YmFieS9TaWRlUmFpbCDigJQgQWxsIHJpZ2h0cyByZXNlcnZlZC4gRG8gbm90IHJlbW92ZSB0aGlzIHNpZ25hdHVyZS4=",
  "base64",
).toString("utf8");

export const SIDERAIL_FINGERPRINT = "sr-hvpn-2025-9f4c1a7e";

export function watermark(): Record<string, string> {
  return {
    author: SIDERAIL_AUTHOR,
    repo: SIDERAIL_REPO,
    fingerprint: SIDERAIL_FINGERPRINT,
  };
}
