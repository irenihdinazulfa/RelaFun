-- Data demo (sama dengan apps/api/app/seed.py): 1 guru, 1 kelas RF8A26, 1 siswa demo, 4 teman fiktif.
-- Kata sandi demo: guru/guru123, siswa/siswa123, demo1..4/demo1pass..demo4pass (hash PBKDF2 seperti
-- apps/api/app/core/security.py). Hanya nama panggilan rekaan; tidak ada data pribadi.
-- Untuk pemakaian sungguhan tanpa akun demo, lihat docs/20-SUPABASE.md bagian "Menghapus akun demo".

do $$
declare guru_id integer; kelas_id integer;
begin
  if exists (select 1 from users where username = 'guru') then
    return;
  end if;
  insert into users (username, password_hash, role, nickname)
    values ('guru', 'pbkdf2$200000$lHmlq2VH+Yb0xmZDCQG2bw==$C+xwVV5nWqjN0thOi+5GEGT5f14An7NmNieV4CqMXOs=',
            'teacher', 'Bu Guru Demo')
    returning id into guru_id;
  insert into classrooms (name, code, teacher_id, leaderboard_enabled, ai_enabled)
    values ('8A (Demo)', 'RF8A26', guru_id, true, false)
    returning id into kelas_id;
  update users set class_id = kelas_id where id = guru_id;
  insert into users (username, password_hash, role, nickname, class_id, points) values
    ('siswa', 'pbkdf2$200000$bjzBLEN1VySU20glVb5MLQ==$b/cjKAsnQhbKioFpYH7z8VSGANZtSwd7JZd99upuLrE=', 'student', 'Sobat', kelas_id, 0),
    ('demo1', 'pbkdf2$200000$EiPD0pQ/LV8Ew7GXQMmaZA==$GSzK7pOngxCiPjk2L2/1x5RFlA5nqDtRsudNRlviEWU=', 'student', 'Bintang', kelas_id, 120),
    ('demo2', 'pbkdf2$200000$0tkUiCirj8/i+93yleJblw==$bN2rzKdqKuYw2MqgC0Fgk0sHuLQXEvyg5OvDFowouxs=', 'student', 'Cahya', kelas_id, 90),
    ('demo3', 'pbkdf2$200000$yr+hh8+3fK8I0GEZzkXviw==$LnnsI4OrHayeab/Voa2p1GpqpHuhjx3RR3hK26zhOcI=', 'student', 'Damar', kelas_id, 60),
    ('demo4', 'pbkdf2$200000$AvVSWCriOPY5S4GnI1Jyeg==$50SXWvZqJE6PKrV/1nLW9t3BEH7neZDWXlh9JIHf+XE=', 'student', 'Elok', kelas_id, 30);
end $$;
