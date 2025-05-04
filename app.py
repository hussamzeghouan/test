# تطبيق Halftone داخل شكل الشعار
import streamlit as st
from PIL import Image, ImageOps, ImageDraw, ImageFont
import numpy as np
import io
from datetime import datetime

st.set_page_config(
    page_title="تطبيق Halftone",
    page_icon="🎨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS مخصص
st.markdown("""
    <style>
    .stApp { direction: rtl; }
    .main-header {
        font-size: 3em;
        text-align: center;
        color: #2c3e50;
        padding: 20px;
        background: linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%);
        border-radius: 10px;
        margin-bottom: 30px;
    }
    .info-box {
        background-color: #f0f2f6;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
    }
    .feature-card {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 15px;
    }
    </style>
""", unsafe_allow_html=True)

def main():
    st.markdown('<h1 class="main-header">🎨 تطبيق Halftone داخل شكل الشعار</h1>', unsafe_allow_html=True)
    st.sidebar.header("⚙️ الإعدادات")
    st.sidebar.subheader("🎯 الإعدادات الأساسية")

    gradient_type = st.sidebar.selectbox("نوع التدرج", ["دائري", "أفقي", "عمودي"])
    tile_spacing = st.sidebar.slider("عدد التكرارات", 5, 50, 10, 1)
    min_size = st.sidebar.slider("أصغر حجم للتكرار", 2, 20, 5, 1)
    max_size = st.sidebar.slider("أكبر حجم للتكرار", 10, 100, 20, 1)

    st.sidebar.subheader("🏷️ إعدادات الجودة")
    quality_setting = st.sidebar.radio("جودة المخرجات", ["عادية", "عالية", "ممتازة"], index=1)
    preserve_colors = st.sidebar.checkbox("الحفاظ على الألوان الأصلية", value=True)

    col1, col2 = st.columns([1, 1])

    with col1:
        st.markdown("""
        <div class="info-box">
        <h3>📋 كيفية الاستخدام:</h3>
        <ol>
        <li>ارفع صورة الشعار</li>
        <li>اختر نوع التدرج</li>
        <li>اضبط الإعدادات</li>
        <li>اضغط معاينة</li>
        </ol>
        </div>
        """, unsafe_allow_html=True)
        uploaded_file = st.file_uploader("ارفع صورة الشعار", type=["png", "jpg", "jpeg"])

    with col2:
        st.markdown("""
        <div class="info-box">
        <h3>💡 نصائح:</h3>
        <ul>
        <li>استخدم صوراً عالية الدقة</li>
        <li>الشعارات البسيطة أفضل</li>
        </ul>
        </div>
        """, unsafe_allow_html=True)

    if uploaded_file:
        try:
            image_rgba = Image.open(uploaded_file).convert("RGBA")
            if image_rgba.size[0] == 0 or image_rgba.size[1] == 0:
                st.error("الصورة فارغة.")
                return

            quality_settings = { "عادية": 600, "عالية": 1000, "ممتازة": 1500 }
            original_width, original_height = image_rgba.size
            aspect_ratio = original_width / original_height
            max_size_processing = quality_settings[quality_setting]

            if aspect_ratio > 1:
                output_width = max_size_processing
                output_height = int(max_size_processing / aspect_ratio)
            else:
                output_height = max_size_processing
                output_width = int(max_size_processing * aspect_ratio)

            image_rgba = image_rgba.resize((output_width, output_height), Image.Resampling.LANCZOS)
            r, g, b, a = image_rgba.split()

            if a.getextrema()[0] < 255:
                mask_resized = np.array(a) > 0
            else:
                image_gray = image_rgba.convert("L")
                mask_resized = apply_otsu_threshold(image_gray)

            coords = np.column_stack(np.where(mask_resized))
            if coords.shape[0] == 0:
                st.error("لم يتم العثور على شكل واضح.")
                return

            center_y, center_x = coords.mean(axis=0).astype(int)

            tile = prepare_color_tile(image_rgba) if preserve_colors else image_rgba.resize((30, 30), Image.Resampling.LANCZOS)

            if st.button("معاينة النتيجة", type="primary"):
                final_img = process_halftone_image(image_rgba, mask_resized, gradient_type,
                    tile_spacing, min_size, max_size, center_x, center_y, output_width, output_height, tile)

                col1, col2 = st.columns([1, 1])
                with col1:
                    st.subheader("الصورة الأصلية")
                    st.image(image_rgba, use_column_width=True)
                with col2:
                    st.subheader("النتيجة")
                    st.image(final_img, use_column_width=True)

                if st.button("تحميل الصورة", type="secondary"):
                    buf = io.BytesIO()
                    final_img.save(buf, format="PNG")
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    st.download_button("📥 تحميل", data=buf.getvalue(), file_name=f"halftone_{timestamp}.png", mime="image/png")

        except Exception as e:
            st.error("حدث خطأ أثناء المعالجة")
            if st.checkbox("عرض تفاصيل الخطأ"):
                st.exception(e)

    st.sidebar.markdown("---")
    st.sidebar.subheader("📋 معلومات")
    if uploaded_file:
        st.sidebar.write(f"الحجم: {round(uploaded_file.size / 1024, 2)} ك.ب")

# === دوال مساعدة ===
def apply_otsu_threshold(image_gray):
    image_array = np.array(image_gray)
    hist, _ = np.histogram(image_array, bins=256, range=(0, 256))
    hist = hist.astype(float) / hist.sum()
    threshold, max_var = 0, 0
    for t in range(256):
        w0, w1 = hist[:t].sum(), hist[t:].sum()
        if w0 == 0 or w1 == 0: continue
        m0 = (hist[:t] * np.arange(t)).sum() / w0
        m1 = (hist[t:] * np.arange(t, 256)).sum() / w1
        var_between = w0 * w1 * (m0 - m1) ** 2
        if var_between > max_var:
            max_var = var_between
            threshold = t
    return np.array(image_gray) < threshold

def prepare_color_tile(image, preserve_transparency=True):
    tile_size = max(10, min(50, max(image.size) // 20))
    return image.resize((tile_size, tile_size), Image.Resampling.LANCZOS)

def process_halftone_image(image_rgba, mask_resized, gradient_type, tile_spacing, min_size, max_size,
                           center_x, center_y, output_width, output_height, tile):
    final_img = Image.new("RGBA", (output_width, output_height), (255, 255, 255, 0))
    for y in range(0, output_height, tile_spacing):
        for x in range(0, output_width, tile_spacing):
            if not (0 <= y < output_height and 0 <= x < output_width and mask_resized[y, x]):
                continue
            dist, max_dist = calculate_gradient_distance(x, y, center_x, center_y, output_width, output_height, gradient_type)
            scale = 1.0 - (dist / max_dist) if max_dist > 0 else 1.0
            tile_size_current = max(min_size, int(max_size * scale))
            paste_x, paste_y = x - tile_size_current // 2, y - tile_size_current // 2
            if paste_x < 0 or paste_y < 0 or paste_x + tile_size_current > output_width or paste_y + tile_size_current > output_height:
                continue
            end_x = min(paste_x + tile_size_current, output_width)
            end_y = min(paste_y + tile_size_current, output_height)
            if paste_x >= 0 and paste_y >= 0:
                submask = mask_resized[paste_y:end_y, paste_x:end_x]
                if submask.size > 0 and np.all(submask):
                    tile_resized = tile.resize((end_x - paste_x, end_y - paste_y), Image.Resampling.LANCZOS)
                    final_img.paste(tile_resized, (paste_x, paste_y), tile_resized)
    return final_img

if __name__ == "__main__":
    main()
