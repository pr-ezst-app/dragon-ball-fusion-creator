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

ANIMALS = {
    "cat", "kitten", "kitty", "dog", "puppy", "doggo", "wolf", "fox", "bear",
    "lion", "tiger", "leopard", "cheetah", "jaguar", "panther", "panda",
    "rabbit", "bunny", "hamster", "guinea pig", "ferret", "otter", "raccoon",
    "bird", "parrot", "owl", "eagle", "hawk", "falcon", "penguin", "duck",
    "horse", "pony", "unicorn", "deer", "elk", "moose", "giraffe", "elephant",
    "snake", "lizard", "dragon", "turtle", "frog", "fish", "shark", "whale",
    "dolphin", "octopus", "crab", "spider", "butterfly", "bee",
}

REAL_PEOPLE_HINTS = {
    "man", "woman", "person", "human", "guy", "girl", "boy", "lady",
    "president", "king", "queen", "prince", "princess",
}

def classify_subject(name: str, species: str = "") -> str:
    """Returns 'anime_char', 'animal', 'real', or 'unknown'. Species overrides detection."""
    # Species field takes priority
    check = (species or name).lower().strip()
    if not species:
        if check in KNOWN_CHARACTERS:
            return "anime_char"
    for animal in ANIMALS:
        if animal in check:
            return "animal"
    for hint in REAL_PEOPLE_HINTS:
        if hint in check:
            return "real"
    # Fall back to name-only lookup for known anime chars
    if name.lower().strip() in KNOWN_CHARACTERS:
        return "anime_char"
    return "unknown"


def build_prompt(name1: str, name2: str, species1: str = "", species2: str = "") -> str:
    kind1 = classify_subject(name1, species1)
    kind2 = classify_subject(name2, species2)
    desc1 = KNOWN_CHARACTERS.get(name1.lower().strip(), "")
    desc2 = KNOWN_CHARACTERS.get(name2.lower().strip(), "")

    # Build label strings that include species hint when provided
    label1 = f"{name1} ({species1})" if species1 else name1
    label2 = f"{name2} ({species2})" if species2 else name2

    # Both animals
    if kind1 == "animal" and kind2 == "animal":
        type1 = species1 or name1
        type2 = species2 or name2
        return (
            f"A single hybrid creature that is a perfect biological fusion of a {type1} and a {type2}. "
            f"The creature naturally combines physical features of both animals: "
            f"body shape, fur/feather/scale patterns, coloring, face, ears, tail, and limbs "
            f"blended seamlessly into one coherent animal. "
            f"Photorealistic wildlife photography style, natural environment, "
            f"soft natural lighting, highly detailed, sharp focus, beautiful creature portrait."
        )

    # One animal, one anime/other char
    if (kind1 == "animal") != (kind2 == "animal"):
        animal_label = (species1 or name1) if kind1 == "animal" else (species2 or name2)
        char_label = label2 if kind1 == "animal" else label1
        char_desc = desc1 if kind2 == "animal" else desc2
        char_info = f"{char_label} ({char_desc})" if char_desc else char_label
        return (
            f"An anthropomorphic {animal_label}-person fusion character inspired by {char_info}. "
            f"The character has {animal_label} features (ears, tail, fur markings, eyes) "
            f"blended with the outfit, colors, and visual style of {char_label}. "
            f"Full-body illustration, detailed character design, clean art style. "
            f"High quality digital illustration."
        )

    # Both known anime characters
    if kind1 == "anime_char" and kind2 == "anime_char":
        return (
            f"A fusion of two anime characters merged into one single being. "
            f"Character 1: {name1} ({desc1}). Character 2: {name2} ({desc2}). "
            f"The fusion blends their hair styles, hair colors, outfit colors and patterns, "
            f"facial features, and signature accessories into ONE coherent unified character. "
            f"The result clearly feels like a natural blend of both originals. "
            f"Dynamic full-body pose, dramatic lighting. "
            f"Detailed anime illustration style matching the source material. High quality, sharp."
        )

    # One known anime char + unknown
    if kind1 == "anime_char" or kind2 == "anime_char":
        known_desc = desc1 if kind1 == "anime_char" else desc2
        known_name = name1 if kind1 == "anime_char" else name2
        other_label = label2 if kind1 == "anime_char" else label1
        return (
            f"A fusion character merging {known_name} ({known_desc}) with {other_label}. "
            f"Combine their visual features: hair, outfit colors, facial features, accessories "
            f"into one unified character design. "
            f"Anime illustration style. Full-body pose, dramatic lighting, high quality."
        )

    # Both real people / humans
    if kind1 == "real" or kind2 == "real":
        return (
            f"A realistic portrait of a single person who is a visual fusion of '{label1}' and '{label2}'. "
            f"The face and appearance naturally blends features of both people: "
            f"facial structure, skin tone, hair color and style, expression. "
            f"Photorealistic portrait photography, studio lighting, high detail, sharp."
        )

    # Fully unknown — use species hints if given, otherwise generic
    type_hint1 = species1 or name1
    type_hint2 = species2 or name2
    return (
        f"A creative fusion of '{type_hint1}' and '{type_hint2}' merged into one single entity. "
        f"Naturally blend the visual characteristics, colors, shapes, and defining features "
        f"of both into one coherent design. "
        f"The result should clearly feel like a blend of both originals. "
        f"Dramatic lighting, visually striking full-body composition. "
        f"Highly detailed digital illustration, cinematic quality, sharp."
    )


def generate_fusion_image(name1: str, name2: str, species1: str = "", species2: str = "") -> bytes:
    prompt = build_prompt(name1, name2, species1, species2)

    encoded_prompt = urllib.parse.quote(prompt)
    seed = abs(hash(name1 + name2 + species1 + species2)) % 999999

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
    species1 = (body.get("species1") or "").strip()
    species2 = (body.get("species2") or "").strip()

    image_bytes = generate_fusion_image(name1, name2, species1, species2)
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