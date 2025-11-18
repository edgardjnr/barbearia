-- Corrigir os horários do usuário teste para sexta-feira das 09h às 12h (conforme mencionado pelo usuário)
UPDATE working_hours 
SET end_time = '12:00:00' 
WHERE member_id = 'fdeb2876-ed7b-4883-8d99-6768d16040a2' 
AND day_of_week = 5;