import cv2
import numpy as np
from PIL import Image
import os

input_image_path = r"c:\Users\hope4\Pictures\Screenshot 2025-09-27 113258.png"
output_image_path = r"c:\Users\hope4\Pictures\Screenshot_without_checkmark.png"

img = cv2.imread(input_image_path)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

lower_red1 = np.array([0, 50, 50])
upper_red1 = np.array([10, 255, 255])
lower_red2 = np.array([170, 50, 50])
upper_red2 = np.array([180, 255, 255])

mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
red_mask = cv2.bitwise_or(mask1, mask2)

kernel = np.ones((3,3), np.uint8)
red_mask = cv2.dilate(red_mask, kernel, iterations=2)

result = cv2.inpaint(img, red_mask, 3, cv2.INPAINT_TELEA)

cv2.imwrite(output_image_path, result)

print(f"Image saved to: {output_image_path}")