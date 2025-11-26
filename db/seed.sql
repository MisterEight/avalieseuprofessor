-- Dados iniciais para AvaliaProf

-- Usuarios
INSERT INTO users (nome, email, password_hash, role)
VALUES
  ('Aluno Demo', 'aluno@exemplo.com', 'scrypt:dcccbbfecd47045797da13e57a143d1e:5e156a2b9836df504c7b3156c7b6b7f6a6ce9850c3a07f2df1ebf16a37a2120eb821eabf2c4b1ab2b2d1039292badbc1c9b1b60f1faf539fe89d39d16943033e', 'student'),
  ('Admin Demo', 'admin@exemplo.com', 'scrypt:dcccbbfecd47045797da13e57a143d1e:5e156a2b9836df504c7b3156c7b6b7f6a6ce9850c3a07f2df1ebf16a37a2120eb821eabf2c4b1ab2b2d1039292badbc1c9b1b60f1faf539fe89d39d16943033e', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Instituicoes e departamentos
INSERT INTO institutions (nome) VALUES ('Universidade X') ON CONFLICT DO NOTHING;
INSERT INTO institutions (nome) VALUES ('Universidade Y') ON CONFLICT DO NOTHING;

INSERT INTO departments (institution_id, nome)
VALUES
  ((SELECT id FROM institutions WHERE nome = 'Universidade X'), 'Computacao'),
  ((SELECT id FROM institutions WHERE nome = 'Universidade X'), 'Engenharia'),
  ((SELECT id FROM institutions WHERE nome = 'Universidade Y'), 'Matematica'),
  ((SELECT id FROM institutions WHERE nome = 'Universidade Y'), 'Fisica')
ON CONFLICT DO NOTHING;

-- Professores
INSERT INTO professors (nome, institution_id, department_id, bio)
VALUES
  ('Ana Souza', (SELECT id FROM institutions WHERE nome = 'Universidade X'), (SELECT id FROM departments WHERE nome = 'Computacao' AND institution_id = (SELECT id FROM institutions WHERE nome = 'Universidade X')), 'Professora com foco em projetos praticos.'),
  ('Carlos Silva', (SELECT id FROM institutions WHERE nome = 'Universidade Y'), (SELECT id FROM departments WHERE nome = 'Matematica' AND institution_id = (SELECT id FROM institutions WHERE nome = 'Universidade Y')), 'Didatica clara e avaliacoes justas.'),
  ('Mariana Alves', (SELECT id FROM institutions WHERE nome = 'Universidade X'), (SELECT id FROM departments WHERE nome = 'Engenharia' AND institution_id = (SELECT id FROM institutions WHERE nome = 'Universidade X')), 'Experiencia em laboratorio e pesquisa aplicada.')
ON CONFLICT DO NOTHING;

-- Avaliacoes (aprovadas e pendentes)
INSERT INTO evaluations (professor_id, user_id, rating, comment, status)
VALUES
  ((SELECT id FROM professors WHERE nome = 'Ana Souza'), (SELECT id FROM users WHERE email = 'aluno@exemplo.com'), 5, 'Explica muito bem.', 'aprovada'),
  ((SELECT id FROM professors WHERE nome = 'Ana Souza'), (SELECT id FROM users WHERE email = 'aluno@exemplo.com'), 4, 'Boa didatica, avaliacoes justas.', 'aprovada'),
  ((SELECT id FROM professors WHERE nome = 'Carlos Silva'), (SELECT id FROM users WHERE email = 'aluno@exemplo.com'), 4, 'Exemplos praticos ajudam a entender.', 'pendente')
ON CONFLICT DO NOTHING;
