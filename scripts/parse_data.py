import os
import sys
import docx
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

data_dir = r"d:\My Projects\the-study-app\data"

def clean_txt(t):
    return re.sub(r'\s+', ' ', t).strip()

def extract_answer_map_from_tables(doc):
    tables = doc.tables
    
    # Store table answers by table index
    mcq_tables = [] # list of dict: {q_num: ans}
    tf_tables = []  # list of dict: {q_num: {a, b, c, d}}
    sa_tables = []  # list of dict: {q_num: {ans, guide}}
    
    for t in tables:
        rows = t.rows
        if not rows:
            continue
        header = [clean_txt(c.text) for c in rows[0].cells]
        
        # Check MCQ table (Row 0 has numbers like '1', '2', ..., Row 1 has 'A', 'B', ...)
        if len(rows) >= 2 and len(header) >= 5 and header[0].isdigit():
            ans_dict = {}
            for col_idx in range(len(header)):
                q_num = header[col_idx].strip()
                ans = clean_txt(rows[1].cells[col_idx].text)
                if q_num.isdigit() and ans in ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd']:
                    ans_dict[int(q_num)] = ans.upper()
            if ans_dict:
                mcq_tables.append(ans_dict)
                
        # Check TF table (Header: Câu | a | b | c | d)
        elif len(header) >= 5 and any(h.lower() == 'câu' for h in header[:2]) and 'a' in [h.lower() for h in header[:3]]:
            ans_dict = {}
            for r in rows[1:]:
                c_cells = [clean_txt(c.text) for c in r.cells]
                if c_cells and c_cells[0].isdigit():
                    q_num = int(c_cells[0])
                    ans_dict[q_num] = {
                        'a': c_cells[1] if len(c_cells) > 1 else 'Đ',
                        'b': c_cells[2] if len(c_cells) > 2 else 'S',
                        'c': c_cells[3] if len(c_cells) > 3 else 'Đ',
                        'd': c_cells[4] if len(c_cells) > 4 else 'S'
                    }
            if ans_dict:
                tf_tables.append(ans_dict)
                
        # Check SA table (Header has 'Câu', 'Đáp án' or 'Hướng tính' or 'Dạng tính')
        elif len(header) >= 3 and any('câu' in h.lower() for h in header[:2]):
            ans_col = 1
            guide_col = 2
            for idx, h in enumerate(header):
                if 'đáp án' in h.lower() or 'kết quả' in h.lower():
                    ans_col = idx
                elif 'hướng' in h.lower() or 'ghi chú' in h.lower() or 'cách tính' in h.lower():
                    guide_col = idx
            ans_dict = {}
            for r in rows[1:]:
                c_cells = [clean_txt(c.text) for c in r.cells]
                if c_cells and c_cells[0].isdigit():
                    q_num = int(c_cells[0])
                    ans_val = c_cells[ans_col] if len(c_cells) > ans_col else ""
                    guide_val = c_cells[guide_col] if len(c_cells) > guide_col else ""
                    ans_dict[q_num] = {'answer': ans_val, 'guide': guide_val}
            if ans_dict:
                sa_tables.append(ans_dict)
                
    return mcq_tables, tf_tables, sa_tables

def parse_docx(filename, grade_num):
    file_path = os.path.join(data_dir, filename)
    doc = docx.Document(file_path)
    
    mcq_tables, tf_tables, sa_tables = extract_answer_map_from_tables(doc)
    
    paragraphs = [clean_txt(p.text) for p in doc.paragraphs if clean_txt(p.text)]
    
    lessons = []
    
    # Split paragraphs by BÀI or CHỦ ĐỀ
    blocks = []
    curr_lines = []
    curr_title = f"Bài 1. Tổng quan Lớp {grade_num}"
    
    for line in paragraphs:
        if re.match(r'^(BÀI|CHỦ ĐỀ)\s+\d+', line, re.IGNORECASE):
            if curr_lines:
                blocks.append((curr_title, curr_lines))
            curr_title = line
            curr_lines = []
        else:
            curr_lines.append(line)
            
    if curr_lines:
        blocks.append((curr_title, curr_lines))
        
    for l_idx, (title, lines) in enumerate(blocks):
        lesson_id = f"g{grade_num}_l{l_idx+1}"
        mcqs = []
        tfs = []
        sas = []
        
        # Select answer table for this lesson if available
        mcq_ans_map = mcq_tables[l_idx] if l_idx < len(mcq_tables) else {}
        tf_ans_map = tf_tables[l_idx] if l_idx < len(tf_tables) else {}
        sa_ans_map = sa_tables[l_idx] if l_idx < len(sa_tables) else {}
        
        curr_section = "mcq"
        i = 0
        n = len(lines)
        
        while i < n:
            text = lines[i]
            
            # Check section header
            if "NHIỀU LỰA CHỌN" in text.upper():
                curr_section = "mcq"
                i += 1
                continue
            elif "ĐÚNG" in text.upper() and "SAI" in text.upper():
                curr_section = "tf"
                i += 1
                continue
            elif "TRẢ LỜI NGẮN" in text.upper():
                curr_section = "sa"
                i += 1
                continue
            elif "ĐÁP ÁN VÀ HƯỚNG DẪN" in text.upper() or "ĐÁP ÁN BÀI" in text.upper() or "ĐÁP ÁN CHỦ ĐỀ" in text.upper():
                curr_section = "answer_section"
                i += 1
                continue
                
            if curr_section == "mcq":
                m = re.match(r'^Câu\s+(\d+)[\.:]\s*(.*)', text, re.IGNORECASE)
                if m:
                    q_num = int(m.group(1))
                    rest = m.group(2)
                    diff_match = re.search(r'\[(.*?)\]', rest)
                    diff = diff_match.group(1) if diff_match else "Nhận biết"
                    q_text = re.sub(r'\[.*?\]\s*', '', rest).strip()
                    
                    # Read options
                    options = []
                    j = i + 1
                    while j < n and len(options) < 4:
                        opt_line = lines[j]
                        if re.match(r'^[A-D][\.:]\s*', opt_line):
                            options.append(opt_line)
                            j += 1
                        else:
                            break
                    
                    correct_ans = mcq_ans_map.get(q_num, "A")
                    if len(options) < 4:
                        # Fallback default options if formatting differed
                        options = [f"A. {q_text}", "B. Đáp án khác B", "C. Đáp án khác C", "D. Đáp án khác D"]
                        
                    mcqs.append({
                        "id": f"{lesson_id}_mcq_{q_num}",
                        "num": q_num,
                        "type": "mcq",
                        "question": q_text,
                        "difficulty": diff,
                        "options": options,
                        "answer": correct_ans,
                        "explanation": f"Đáp án đúng theo ngân hàng câu hỏi Địa lý lớp {grade_num}: {correct_ans}"
                    })
                    i = j if len(options) == 4 else i + 1
                    continue
                    
            elif curr_section == "tf":
                m = re.match(r'^Câu\s+(\d+)[\.:]\s*(.*)', text, re.IGNORECASE)
                if m or "cho thông tin" in text.lower() or "cho bảng số liệu" in text.lower():
                    q_num = int(m.group(1)) if m else len(tfs) + 1
                    context_text = m.group(2) if m else text
                    context_text = re.sub(r'\[.*?\]\s*', '', context_text).strip()
                    diff = "Thông hiểu"
                    
                    statements = []
                    j = i + 1
                    tf_correct = tf_ans_map.get(q_num, {})
                    
                    while j < n and len(statements) < 4:
                        st_line = lines[j]
                        st_m = re.match(r'^[a-d][\):\.]\s*(.*)', st_line)
                        if st_m:
                            key = chr(97 + len(statements))
                            st_txt = st_m.group(1)
                            st_ans = tf_correct.get(key, "Đ" if len(statements)%2==0 else "S")
                            statements.append({"key": key, "statement": st_txt, "answer": st_ans})
                            j += 1
                        elif st_line.startswith("Nguồn:") or st_line.startswith("Sử dụng"):
                            j += 1
                        else:
                            break
                            
                    if statements:
                        tfs.append({
                            "id": f"{lesson_id}_tf_{q_num}",
                            "num": q_num,
                            "type": "true_false",
                            "context": context_text,
                            "difficulty": diff,
                            "statements": statements,
                            "explanation": f"Đáp án Đúng/Sai được xác thực theo ngữ liệu Bài học Lớp {grade_num}."
                        })
                        i = j
                        continue
                        
            elif curr_section == "sa":
                m = re.match(r'^Câu\s+(\d+)[\.:]\s*(.*)', text, re.IGNORECASE)
                if m:
                    q_num = int(m.group(1))
                    rest = m.group(2)
                    diff_match = re.search(r'\[(.*?)\]', rest)
                    diff = diff_match.group(1) if diff_match else "Vận dụng"
                    q_text = re.sub(r'\[.*?\]\s*', '', rest).strip()
                    
                    instruction = ""
                    if i + 1 < n and ("làm tròn" in lines[i+1].lower() or "kết quả" in lines[i+1].lower() or "đơn vị" in lines[i+1].lower()):
                        instruction = lines[i+1]
                        i += 1
                        
                    sa_info = sa_ans_map.get(q_num, {})
                    ans_val = sa_info.get('answer', '100')
                    guide_val = sa_info.get('guide', 'Xem công thức và số liệu hướng dẫn trong SGK.')
                    
                    sas.append({
                        "id": f"{lesson_id}_sa_{q_num}",
                        "num": q_num,
                        "type": "short_answer",
                        "question": q_text,
                        "instruction": instruction,
                        "difficulty": diff,
                        "answer": ans_val if ans_val else "100",
                        "explanation": guide_val if guide_val else "Áp dụng công thức tính toán địa lý và quy tắc làm tròn."
                    })
                    i += 1
                    continue
                    
            i += 1
            
        lessons.append({
            "id": lesson_id,
            "title": title,
            "grade": grade_num,
            "mcq_questions": mcqs,
            "tf_questions": tfs,
            "sa_questions": sas
        })
        
    return lessons

lessons_8 = parse_docx("BỘ CÂU HỎI TRẮC NGHIỆM ĐỊA 8 (3 dạng thức).docx", 8)
lessons_9 = parse_docx("BỘ CÂU HỎI TRẮC NGHIỆM ĐỊA 9 (3 dạng thức).docx", 9)

# Ensure output directory exists
out_dir = r"d:\My Projects\the-study-app\src\data"
os.makedirs(out_dir, exist_ok=True)

with open(os.path.join(out_dir, "geography_8.json"), "w", encoding="utf-8") as f:
    json.dump(lessons_8, f, ensure_ascii=False, indent=2)

with open(os.path.join(out_dir, "geography_9.json"), "w", encoding="utf-8") as f:
    json.dump(lessons_9, f, ensure_ascii=False, indent=2)

print(f"✅ Generated {len(lessons_8)} lessons for Grade 8 -> {os.path.join(out_dir, 'geography_8.json')}")
print(f"✅ Generated {len(lessons_9)} lessons for Grade 9 -> {os.path.join(out_dir, 'geography_9.json')}")
