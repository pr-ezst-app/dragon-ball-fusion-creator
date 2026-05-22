"""
Fusion endpoint: accepts two base64-encoded character images + names,
uses Pollinations.ai (free, no key) to generate a fused character.
The generated image bytes are returned as base64 in the response
so the frontend can display and download it directly.
"""
import json
import urllib.request
import urllib.parse
import base64
import random


CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def generate_fusion_image(name1: str, name2: str) -> bytes:
    prompt = (
        f"Create a single epic anime fusion character that perfectly combines "
        f"the visual traits of '{name1}' and '{name2}'. "
        f"Merge their distinctive features: hair color, hair style, costume colors, "
        f"facial features, and signature accessories into ONE unified powerful warrior. "
        f"Dynamic full-body pose, intense golden ki energy aura with lightning effects, "
        f"dark cosmic background with energy particles. "
        f"Dragon Ball Z anime art style, cel-shaded, highly detailed, cinematic quality."
    )
    encoded_prompt = urllib.parse.quote(prompt)
    seed = abs(hash(name1 + name2)) % 999999

    url = (
        f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        f"?model=flux&width=1024&height=1024&nologo=true&seed={seed}"
    )
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=90) as resp:
        return resp.read()


def make_fusion_name(name1: str, name2: str) -> str:
    n1 = name1.strip()
    n2 = name2.strip()
    half1 = n1[:max(1, len(n1) // 2)]
    half2 = n2[len(n2) // 2:]
    return (half1 + half2).title()


def handler(event: dict, context) -> dict:
    """
    POST /fuse
    Body JSON: { name1: string, name2: string, image1?: base64, image2?: base64 }
    Returns: { fusionImageB64: string, fusionName: string, powerLevel: number }
    The fusionImageB64 is a data:image/jpeg;base64,... string ready for <img src>.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    name1 = (body.get("name1") or "Character 1").strip()
    name2 = (body.get("name2") or "Character 2").strip()

    image_bytes = generate_fusion_image(name1, name2)
    image_b64 = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("utf-8")

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "fusionImageB64": image_b64,
            "fusionName": make_fusion_name(name1, name2),
            "powerLevel": random.randint(15000, 99999),
        }),
    }
