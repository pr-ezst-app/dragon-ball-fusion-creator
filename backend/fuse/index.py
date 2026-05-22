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


KNOWN_CHARACTERS = {
    # Dragon Ball
    "goku": "Dragon Ball Z anime, Saiyan warrior with spiky black hair, orange gi",
    "vegeta": "Dragon Ball Z anime, Saiyan prince with widow's peak black hair, blue spandex armor",
    "gohan": "Dragon Ball Z anime, half-Saiyan with black hair, scholar fighter",
    "frieza": "Dragon Ball Z anime, alien emperor, white and purple sleek body",
    "piccolo": "Dragon Ball Z anime, green-skinned Namekian with white turban and cape",
    # Naruto
    "naruto": "Naruto anime, ninja with spiky blond hair, orange jumpsuit, whisker marks on cheeks",
    "sasuke": "Naruto anime, dark-haired ninja in dark blue clothes, Sharingan eye",
    "sakura": "Naruto anime, pink-haired kunoichi in red outfit",
    "kakashi": "Naruto anime, silver-haired ninja with mask and Sharingan",
    "itachi": "Naruto anime, dark-haired ninja in black Akatsuki robe with red clouds",
    # One Piece
    "luffy": "One Piece anime, rubber pirate with straw hat, red vest, black hair",
    "zoro": "One Piece anime, green-haired swordsman with three swords, white shirt",
    "nami": "One Piece anime, orange-haired navigator with staff",
    "sanji": "One Piece anime, blond chef in black suit with curly eyebrow",
    # Bleach
    "ichigo": "Bleach anime, spiky orange-haired Soul Reaper in black shihakusho with large zanpakuto",
    "rukia": "Bleach anime, short black-haired Soul Reaper in white captain's haori",
    # Demon Slayer
    "tanjiro": "Demon Slayer anime, boy with dark red hair in checkered haori with Nichirin blade",
    "nezuko": "Demon Slayer anime, girl with pink-tipped black hair, bamboo muzzle, pink kimono",
    "zenitsu": "Demon Slayer anime, blond boy in yellow haori with lightning powers",
    # Attack on Titan
    "eren": "Attack on Titan anime, brown-haired soldier in Survey Corps uniform with ODM gear",
    "levi": "Attack on Titan anime, short black-haired captain in Survey Corps cloak",
    # My Hero Academia
    "deku": "My Hero Academia anime, green-haired boy in green rabbit-eared hero costume",
    "bakugo": "My Hero Academia anime, spiky blond with explosive hero costume, fierce expression",
    "todoroki": "My Hero Academia anime, half red half white hair, burn scar, fire and ice powers",
    # One Punch Man
    "saitama": "One Punch Man anime, bald hero in plain yellow jumpsuit and white cape",
    "genos": "One Punch Man anime, cyborg with blond hair, mechanical arms, black bodysuit",
    # Jujutsu Kaisen
    "gojo": "Jujutsu Kaisen anime, tall sorcerer with white hair, blindfold, casual black outfit",
    "yuji": "Jujutsu Kaisen anime, pink-haired stocky fighter in dark school uniform",
    # Other
    "spike": "Cowboy Bebop anime, tall lanky bounty hunter with dark green afro, yellow suit",
    "edward": "Fullmetal Alchemist anime, blond alchemist with red coat and automail arm",
    "roy": "Fullmetal Alchemist anime, dark-haired flame alchemist in military blue uniform",
}

def detect_style(name1: str, name2: str) -> str:
    """
    Infer the visual style from character names.
    Returns a style descriptor string for the prompt.
    """
    n1 = name1.lower().strip()
    n2 = name2.lower().strip()

    desc1 = KNOWN_CHARACTERS.get(n1, "")
    desc2 = KNOWN_CHARACTERS.get(n2, "")

    # If both known and from same franchise, use that style
    if desc1 and desc2:
        style = "detailed anime illustration style matching the source material"
    elif desc1 or desc2:
        style = "anime illustration style"
    else:
        # Unknown characters — go neutral / realistic
        style = "highly detailed digital illustration, realistic proportions, cinematic concept art style"

    return desc1, desc2, style


def generate_fusion_image(name1: str, name2: str) -> bytes:
    desc1, desc2, style = detect_style(name1, name2)

    if desc1 and desc2:
        char_context = (
            f"Character 1 is '{name1}' ({desc1}). "
            f"Character 2 is '{name2}' ({desc2}). "
        )
    elif desc1:
        char_context = f"Character 1 is '{name1}' ({desc1}). Character 2 is '{name2}'. "
    elif desc2:
        char_context = f"Character 1 is '{name1}'. Character 2 is '{name2}' ({desc2}). "
    else:
        char_context = f"Character 1 is '{name1}'. Character 2 is '{name2}'. "

    prompt = (
        f"A fusion of two characters merged into one single being. {char_context}"
        f"The fusion combines their most iconic visual features: "
        f"blending hair styles, hair colors, outfit colors and patterns, "
        f"facial features, and signature accessories into ONE coherent unified character design. "
        f"The result should clearly feel like a blend of both originals. "
        f"Dynamic full-body portrait pose, dramatic lighting, visually striking composition. "
        f"{style}. High quality, detailed, sharp."
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