import os
os.makedirs("src/app/(store)/checkout", exist_ok=True)
with open("src/app/(store)/checkout/page.tsx", "w") as f:
    f.write("hello world")
