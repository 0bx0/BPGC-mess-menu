from PIL import Image
import os

def remove_white_bg(input_path, output_path):
    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is white (or very close to white)
            # Using a threshold of 240 to catch off-whites/artifacts
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully removed background from {input_path}")
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    target_file = "icon.png"
    if os.path.exists(target_file):
        remove_white_bg(target_file, target_file)
    else:
        print(f"File {target_file} not found.")
