-- Xóa các dòng thu tiền (contributions) bị trùng lặp do hậu quả của việc gộp member
-- Giữ lại dòng đã đóng tiền (nếu có) hoặc dòng tạo đầu tiên
DELETE FROM public.contributions
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER(
             PARTITION BY period_id, member_id 
             ORDER BY amount_paid DESC, amount_due DESC
           ) AS rn
    FROM public.contributions
  ) t WHERE t.rn > 1
);

-- Thêm unique constraint cho bảng contributions để không bao giờ bị trùng 1 người đóng 2 bill trong 1 kỳ
-- (Ngoại trừ trường hợp họ mua nhiều phần hụi thì amount_due sẽ được cộng dồn vào 1 bill duy nhất)
ALTER TABLE public.contributions ADD CONSTRAINT unique_period_member UNIQUE (period_id, member_id);
