# Baza Danych - Wypożyczalnia Filmów  
## Borys Rupa, Karolina Marmola

### Ogólna Idea:  
Nasza Baza Danych będzie służyła do przetwarzania i trzymania informacji na temat klientów, dostępnych filmów, wypożyczeń oraz terminów oddania.

### Tabele w bazie danych:

| Tabela | Opis |
|--------|------|
| Member | Informacje o użytkownikach/członkach |
| Movie  | Informacje o samym filmie |
| Copy   | Informacje o kopiach filmu (egzemplarzach) |
| Loan   | Informacje o wypożyczeniach filmów przez członków |

### Member:

| Pole | Opis |
|------|------|
| member_no (PK) | Identyfikator członka |
| firstname | Imię |
| lastname | Nazwisko |
| email | Email |

### Movie:

| Pole | Opis |
|------|------|
| movie_no (PK) | Identyfikator filmu |
| title | Tytuł |
| synopsis | Opis filmu |
| genre | Gatunek |

### Copy:

| Pole | Opis |
|------|------|
| copy_no (PK) | Id kopii |
| movie_no (FK) | Powiązanie z filmem |
| isAvailable | Dostępność |

### Loan:

| Pole | Opis |
|------|------|
| loan_no (PK) | Id wypożyczenia |
| member_no (FK) | Członek |
| copy_no (FK) | Kopia filmu |
| rent_date | Data wypożyczenia |
| due_date | Termin zwrotu |
| return_date | Data zwrotu (NULL jeśli brak) |

### Diagram
![image](img/diagram1.png)