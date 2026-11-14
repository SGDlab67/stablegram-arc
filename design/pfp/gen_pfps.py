"""Pixel-art profile pictures for the demo accounts.

Each character is built on a 40 x 40 grid from parts (hair, face, shirt, hat,
accessories), outlined in black where a part sits over something behind it, then
scaled up with hard edges. Run: python3 gen_pfps.py  ->  writes <handle>.png and sheet.png
"""
from PIL import Image
import numpy as np, os, sys

N = 40
CX = 19.5
BLACK = (17, 17, 17)
WHITE = (250, 250, 247)

def hx(s):
    s = s.lstrip("#")
    return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4))

def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c)

# face half-width per row (rows outside are not face)
FACE = {11: 5, 12: 6, **{y: 7 for y in range(13, 26)}, 26: 6, 27: 5, 28: 4, 29: 3}

def in_face(x, y):
    hw = FACE.get(y)
    return hw is not None and CX - hw <= x + 0.5 <= CX + hw

def in_head(x, y, pad=0, top=7):
    """A rounded dome over the head, used for hair and hats."""
    if y < top:
        return False
    dy = (y + 0.5 - 18) / (11.5 + pad)
    dx = (x + 0.5 - CX) / (8.2 + pad)
    return dx * dx + dy * dy <= 1.0

# ---------- hair masks: (back, front) ----------
def hair_masks(style):
    back = np.zeros((N, N), bool)
    front = np.zeros((N, N), bool)
    for y in range(N):
        for x in range(N):
            dome = in_head(x, y, pad=0.6) and y <= 13
            if style in ("short", "spiky", "wavy", "long", "bun", "bangs", "bob", "pony"):
                if dome:
                    front[y, x] = True
                # sideburns
                if 13 <= y <= 17 and (12 <= x <= 13 or 26 <= x <= 27):
                    front[y, x] = True
            if style == "spiky":
                # five triangular spikes along the top
                for sx in (13, 16, 19, 22, 25):
                    if y == 6 and sx <= x <= sx + 2: front[y, x] = True
                    if y == 5 and sx <= x <= sx + 1: front[y, x] = True
                    if y == 4 and x == sx: front[y, x] = True
            if style == "wavy" and y == 6 and 14 <= x <= 25 and x % 4 in (0, 1):
                front[y, x] = True
            if style == "buzz" and in_head(x, y, pad=0.2) and y <= 11:
                front[y, x] = True
            if style in ("long", "bangs", "pony"):
                if 12 <= y <= (33 if style != "pony" else 24) and (9 <= x <= 13 or 26 <= x <= 30):
                    back[y, x] = True
            if style == "bob" and 12 <= y <= 27 and (10 <= x <= 13 or 26 <= x <= 29):
                back[y, x] = True
            if style in ("bangs", "bob") and 13 <= y <= 14 and 13 <= x <= 26:
                front[y, x] = True
            if style == "bun":
                if (x + 0.5 - CX) ** 2 / 16 + (y + 0.5 - 5) ** 2 / 9 <= 1:
                    front[y, x] = True
            if style == "pony" and 8 <= y <= 22 and 29 <= x <= 32 and not (y > 18 and x == 32):
                back[y, x] = True
            if style == "afro":
                if (x + 0.5 - CX) ** 2 / 13.5 ** 2 + (y + 0.5 - 15) ** 2 / 11.5 ** 2 <= 1 and y <= 27:
                    back[y, x] = True
                if in_head(x, y, pad=1.4) and y <= 13:
                    front[y, x] = True
    # a jagged fringe so short hair is not a flat line
    if style in ("short", "spiky", "wavy", "bun", "pony", "long"):
        for x in (15, 16, 19, 20, 23):
            front[14, x] = True
    return back, front

# ---------- hats ----------
def hat_mask(kind):
    m = np.zeros((N, N), bool)
    band = np.zeros((N, N), bool)
    for y in range(N):
        for x in range(N):
            if kind == "beanie":
                if in_head(x, y, pad=1.6, top=5) and y <= 14:
                    m[y, x] = True
                    if y >= 12:
                        band[y, x] = True
                if (x + 0.5 - CX) ** 2 + (y + 0.5 - 3.4) ** 2 <= 5.0:
                    m[y, x] = True
            if kind == "cap":
                if in_head(x, y, pad=0.9, top=5) and y <= 12:
                    m[y, x] = True
                if 11 <= y <= 13 and 22 <= x <= 35:  # brim, worn to the side
                    m[y, x] = True
                    band[y, x] = True
            if kind == "backcap":
                if in_head(x, y, pad=0.9, top=5) and y <= 12:
                    m[y, x] = True
                if y == 12 and 13 <= x <= 26:
                    band[y, x] = True
    return m, band

# ---------- one character ----------
def render(c):
    skin = hx(c["skin"]); skin_d = shade(skin, 0.86); skin_dd = shade(skin, 0.72)
    hair = hx(c["hair"]); hair_l = shade(hair, 1.35); hair_d = shade(hair, 0.75)
    shirt = hx(c["shirt"]); shirt_2 = hx(c.get("shirt2", "#000000")) if c.get("shirt2") else shade(shirt, 0.8)
    bg = hx(c["bg"])

    img = np.zeros((N, N, 3), np.uint8); img[:] = bg
    part = np.zeros((N, N), np.int8)  # z-order id; 0 = background
    OUT = {1, 2, 3, 4, 5, 6, 7}

    def paint(mask, color_fn, z):
        for y in range(N):
            for x in range(N):
                if mask[y, x]:
                    img[y, x] = color_fn(x, y)
                    part[y, x] = z

    back, front = hair_masks(c["hairstyle"])
    if c.get("hat"):
        # hats sit on the head; short hair under them would only show as sideburns
        front &= ~hat_mask(c["hat"])[0]

    hair_fn = lambda x, y: hair_l if (x + y) % 7 == 0 and y < 12 else (hair_d if x > 24 else hair)
    paint(back, hair_fn, 1)

    shirt_m = np.zeros((N, N), bool)
    for y in range(32, N):
        half = {32: 8, 33: 11, 34: 13}.get(y, 15)
        for x in range(N):
            if CX - half <= x + 0.5 <= CX + half:
                shirt_m[y, x] = True
    pat = c.get("pattern", "solid")
    def shirt_fn(x, y):
        if pat == "plaid":
            return shirt_2 if ((x // 2) + (y // 2)) % 2 == 0 else shirt
        if pat == "stripes":
            return shirt_2 if y % 2 == 0 else shirt
        return shirt_2 if x > 28 else shirt
    paint(shirt_m, shirt_fn, 2)

    neck = np.zeros((N, N), bool)
    for y in range(27, 36):
        for x in range(16, 24):
            if not (y >= 33 and abs(x + 0.5 - CX) > (36 - y) * 1.6):
                neck[y, x] = True
    paint(neck, lambda x, y: skin_dd if y <= 29 else skin_d, 3)

    ears = np.zeros((N, N), bool)
    for y in range(17, 22):
        ears[y, 11] = ears[y, 12] = ears[y, 27] = ears[y, 28] = True
    paint(ears, lambda x, y: skin_d, 4)

    face = np.array([[in_face(x, y) for x in range(N)] for y in range(N)])
    paint(face, lambda x, y: skin_d if x >= 25 else skin, 5)

    paint(front, hair_fn, 6)

    if c.get("hat"):
        hm, band = hat_mask(c["hat"])
        hc = hx(c["hatcolor"]); hb = hx(c.get("hatband", "#000000")) if c.get("hatband") else shade(hc, 0.7)
        paint(hm, lambda x, y: hb if band[y, x] else (shade(hc, 1.15) if (x + y) % 9 == 0 else hc), 7)

    # black outline where a part sits over something behind it
    out = img.copy()
    for y in range(N):
        for x in range(N):
            p = part[y, x]
            if p in OUT:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < N and 0 <= ny < N and part[ny, nx] < p and not (p == 3 and part[ny, nx] == 2 and ny > y and False):
                        out[y, x] = BLACK
                        break
    img = out

    def px(x, y, col):
        if 0 <= x < N and 0 <= y < N:
            img[y, x] = col

    # face details (no outline pass)
    brow = hair_d if c["hairstyle"] != "buzz" else shade(hair, 0.6)
    for x in (14, 15, 16, 17, 22, 23, 24, 25):
        px(x, 16, shade(brow, 0.8))
    iris = hx(c.get("eyes", "#2B4C7E"))
    for x0 in (15, 22):
        px(x0, 18, WHITE); px(x0 + 1, 18, iris); px(x0 + 2, 18, iris)
        px(x0, 19, WHITE); px(x0 + 1, 19, iris); px(x0 + 2, 19, BLACK)
        px(x0 + 1, 17, BLACK); px(x0 + 2, 17, BLACK); px(x0, 17, BLACK)
    if c.get("lashes"):
        px(14, 17, BLACK); px(25, 17, BLACK)
    for y in (20, 21, 22):
        px(20, y, skin_dd)
    px(19, 23, skin_dd); px(20, 23, skin_dd)
    # grin
    for x in range(16, 24):
        px(x, 25, BLACK)
    px(16, 26, BLACK); px(23, 26, BLACK)
    for x in range(17, 23):
        px(x, 26, WHITE)
    for x in range(17, 23):
        px(x, 27, BLACK)
    if c.get("smile") == "closed":
        for x in range(17, 23):
            px(x, 26, BLACK)
        px(16, 26, skin); px(23, 26, skin)
        for x in range(16, 24):
            px(x, 25, skin)
        for x in range(17, 23):
            px(x, 27, skin)
        px(16, 25, BLACK); px(23, 25, BLACK)

    for acc in c.get("acc", []):
        if acc == "glasses":
            for x in range(14, 19):
                px(x, 17, BLACK); px(x, 21, BLACK)
            for x in range(21, 26):
                px(x, 17, BLACK); px(x, 21, BLACK)
            for y in range(17, 22):
                px(14, y, BLACK); px(18, y, BLACK); px(21, y, BLACK); px(25, y, BLACK)
            px(19, 18, BLACK); px(20, 18, BLACK)
            px(13, 18, BLACK); px(26, 18, BLACK)
        if acc == "hoops":
            gold = hx("#E2B33C")
            for (x, y) in ((11, 22), (11, 23), (12, 24), (13, 23), (28, 22), (28, 23), (27, 24), (26, 23)):
                px(x, y, gold)
        if acc == "studs":
            px(12, 22, hx("#E2B33C")); px(27, 22, hx("#E2B33C"))
        if acc == "nosestud":
            px(21, 22, hx("#E2B33C"))
        if acc == "freckles":
            for (x, y) in ((15, 21), (17, 22), (16, 23), (23, 21), (24, 22), (22, 23)):
                px(x, y, shade(skin, 0.7))
        if acc == "stubble":
            for y in range(23, 30):
                for x in range(13, 27):
                    if in_face(x, y) and (x + y) % 2 == 0 and not (16 <= x <= 23 and 25 <= y <= 27):
                        if tuple(img[y, x]) in (skin, skin_d):
                            px(x, y, shade(hair, 1.1))
        if acc == "blush":
            for (x, y) in ((14, 22), (15, 22), (24, 22), (25, 22)):
                px(x, y, hx("#E88A8A"))
        if acc == "headphones":
            band = hx(c.get("phones", "#222222"))
            for x in range(11, 29):
                y = 7 if 14 <= x <= 25 else (8 if 12 <= x <= 27 else 10)
                px(x, y, band)
            for y in range(8, 17):
                px(10, y, band); px(29, y, band)
            for y in range(16, 23):
                for x in (9, 10, 11):
                    px(x, y, band)
                for x in (28, 29, 30):
                    px(x, y, band)
        if acc == "chain":
            gold = hx("#E2B33C")
            for (x, y) in ((16, 32), (17, 33), (18, 34), (19, 34), (20, 34), (21, 34), (22, 33), (23, 32)):
                px(x, y, gold)
    return img

CROP = (2, 1, 38, 37)  # x0, y0, x1, y1 on the 40 grid: head fills the frame, shoulders at the bottom

def crop(img):
    x0, y0, x1, y1 = CROP
    return img[y0:y1, x0:x1]

def save(img, path, scale=14):
    c = crop(img)
    Image.fromarray(np.ascontiguousarray(c), "RGB").resize((c.shape[1] * scale, c.shape[0] * scale), Image.NEAREST).save(path)

CHARACTERS = [
    dict(handle="taihl", skin="#E8B98E", hair="#1C1A1A", hairstyle="spiky", shirt="#2E4A7D", bg="#9DB8A0", eyes="#3A2A1E", acc=["glasses"]),
    dict(handle="ana", skin="#D9A07A", hair="#4A2C1C", hairstyle="long", shirt="#F2EEE6", shirt2="#D9D2C5", bg="#D9A6A6", eyes="#4A2C1C", acc=["hoops", "blush"], lashes=True),
    dict(handle="wes", skin="#F0C8A4", hair="#E3C063", hairstyle="short", shirt="#3F7F5F", bg="#E3C27A", eyes="#2B6CB0", hat="cap", hatcolor="#C8423B", hatband="#8E2B26"),
    dict(handle="sabina", skin="#7A4A32", hair="#1E1410", hairstyle="afro", shirt="#F2C14E", bg="#B7A6D6", eyes="#2A1A12", acc=["studs"], lashes=True),
    dict(handle="maya", skin="#F3CDB0", hair="#B4532A", hairstyle="bun", shirt="#F2EEE6", shirt2="#1F4F82", pattern="stripes", bg="#6FA8A6", eyes="#3C6E47", acc=["freckles"], lashes=True),
    dict(handle="jordan", skin="#5A3826", hair="#140E0B", hairstyle="buzz", shirt="#1E1E22", bg="#E79B6E", eyes="#2A1A12", acc=["headphones", "chain"], phones="#F2EEE6"),
    dict(handle="dev", skin="#B07A55", hair="#16110F", hairstyle="wavy", shirt="#7A2E3B", bg="#8DB3DA", eyes="#2A1A12", acc=["stubble"], smile="closed"),
    dict(handle="priya", skin="#C08B66", hair="#120E0D", hairstyle="bangs", shirt="#6B4C9A", bg="#A8D5BA", eyes="#2A1A12", acc=["nosestud", "studs"], lashes=True, smile="closed"),
    dict(handle="zoe", skin="#F6D7BF", hair="#F0D48A", hairstyle="bob", shirt="#5E7FA8", shirt2="#4D6B90", pattern="plaid", bg="#7E8FA3", eyes="#2B6CB0", hat="beanie", hatcolor="#E58FA8", hatband="#C9708A", acc=["blush"], lashes=True),
]

if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    tiles = []
    for c in CHARACTERS:
        img = render(c)
        save(img, os.path.join(here, f"{c['handle']}.png"))
        tiles.append(Image.fromarray(np.ascontiguousarray(crop(img)), "RGB").resize((240, 240), Image.NEAREST))
    sheet = Image.new("RGB", (240 * 5 + 60, 240 * 2 + 30), (243, 238, 229))
    for i, t in enumerate(tiles):
        sheet.paste(t, (10 + (i % 5) * 250, 10 + (i // 5) * 250))
    sheet.save(os.path.join(here, "sheet.png"))
    print("ok", len(tiles))
