create table member
(
    member_no int identity
        constraint pk_member
            primary key,
    firstname nvarchar(50)                          not null,
    lastname  nvarchar(50)                          not null,
    email     nvarchar(100)                         not null
        constraint uq_member_email
            unique,
    password  nvarchar(255) default 'password123'   not null,
    balance   decimal(10, 2)
        constraint DF_member_balance default 100.00 not null
)
go

create table movie
(
    movie_no int identity
        constraint pk_movie
            primary key,
    title    nvarchar(50)                        not null
        constraint uq_movie_title
            unique,
    genre    nvarchar(50)                        not null,
    synopsis nvarchar(100),
    price    decimal(5, 2)
        constraint DF_movies_price default 15.00 not null
)
go

create table copy
(
    copy_no     int identity
        constraint pk_copy
            primary key,
    movie_no    int           not null
        constraint fk_copy_movie
            references movie,
    isAvailable bit default 1 not null
)
go

create table loan
(
    loan_no     int identity
        constraint pk_loan
            primary key,
    member_no   int  not null
        constraint fk_loan_member
            references member,
    copy_no     int  not null
        constraint fk_loan_copy
            references copy,
    rent_date   date not null,
    due_date    date not null,
    return_date date
)
go

create table reservation
(
    reservation_no   int identity
        constraint pk_reservation
            primary key,
    member_no        int                            not null
        constraint fk_reservation_member
            references member,
    movie_no         int                            not null
        constraint fk_reservation_movie
            references movie,
    reservation_date datetime     default getdate() not null,
    status           nvarchar(20) default 'ACTIVE'  not null
)
go

create   view vw_active_loans as
    select
        l.loan_no,
        m.firstname,
        m.lastname,
        mv.title,
        l.rent_date,
        l.due_date
from loan l
inner join member m on l.member_no = m.member_no
inner join copy c on l.copy_no = c.copy_no
inner join movie mv on c.movie_no = mv.movie_no
where l.return_date is null
go

create   view vw_available_movies as
    select m.movie_no,
           m.title,
           m.genre,
           m.synopsis,
           m.price,
           sum(case when c.isAvailable = 1 then 1 else 0 end) as available_copies,
           count(c.copy_no) as total_copies
from movie m
left join dbo.copy c on m.movie_no = c.movie_no
group by
    m.movie_no, m.title, m.genre, m.synopsis,m.price
go

create   view vw_member_loans as
    select
        m.member_no,
        m.firstname,
        m.lastname,
        mv.title,
        l.rent_date,
        l.due_date,
        l.return_date,
        case
            when l.return_date is null then 'ACTIVE'
            when l.return_date > l.due_date then 'LATE_RETURN'
            else 'RETURNED'
    end as status
from loan l
inner join member m on l.member_no = m.member_no
inner join copy c on l.copy_no = c.copy_no
inner join movie mv on c.movie_no = mv.movie_no
go

create   view vw_overdue_loans as
    select
        l.loan_no,
        m.firstname,
        m.lastname,
        mv.title,
        l.due_date,
        datediff(day,l.due_date,getdate()) as days_overdue
from loan l
inner join member m on l.member_no = m.member_no
inner join copy c on l.copy_no = c.copy_no
inner join movie mv on c.movie_no = mv.movie_no
where l.return_date is null
and l.due_date < getdate()
go

create   view vw_popular_movies as
    select
        mv.movie_no,
        mv.title,
        mv.genre,
        count(l.loan_no) as total_loans
from movie mv
inner join copy c on mv.movie_no = c.movie_no
inner join loan l on c.copy_no = l.copy_no
group by mv.movie_no, mv.title, mv.genre
go

create   view vw_reservations as
    select
        r.reservation_no,
        m.firstname,
        m.lastname,
        mv.title,
        r.reservation_date,
        r.status
from reservation r
inner join member m on r.member_no = m.member_no
inner join movie mv on r.movie_no = mv.movie_no
where r.status = 'ACTIVE'
go

create   function f_is_movie_available(@movie_id int)
returns bit
as
    begin
        declare @result bit;
        if exists(
            select 1
            from copy
            where copy.movie_no = @movie_id
            and copy.isAvailable = 1
        )
        set @result = 1;
        else
        set @result = 0;

        return @result;
    end
go

CREATE PROCEDURE p_prolong_loan
    @memberId INT,
    @loanId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRAN;

        DECLARE @currentBalance DECIMAL(10,2);

        SELECT @currentBalance = balance
        FROM Member WITH (UPDLOCK, ROWLOCK)
        WHERE member_no = @memberId;

        IF @currentBalance < 2.00
            BEGIN
                THROW 50001, 'Brak wystarczających środków na koncie!', 1;
            END

        UPDATE Member
        SET balance = balance - 2.00
        WHERE member_no = @memberId;

        UPDATE Loan
        SET due_date = DATEADD(day, 1, due_date)
        WHERE loan_no = @loanId;

        COMMIT TRAN;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRAN;
        THROW;
    END CATCH;
END;
go

CREATE   PROCEDURE p_rent_movie
    @member_no int,
    @movie_no int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @copy_no int;
    DECLARE @movie_price decimal(5,2);
    DECLARE @user_balance decimal(10,2);

    BEGIN TRANSACTION;
    BEGIN TRY
        SELECT @movie_price = price FROM movie WHERE movie_no = @movie_no;
        SELECT @user_balance = balance FROM member WITH (UPDLOCK, ROWLOCK) WHERE member_no = @member_no;

        IF @user_balance < @movie_price
            THROW 50003, 'Brak środków na koncie!', 1;

        SELECT TOP 1 @copy_no = copy_no
        FROM copy WITH (UPDLOCK, ROWLOCK)
        WHERE movie_no = @movie_no AND isAvailable = 1;

        UPDATE member SET balance = balance - @movie_price WHERE member_no = @member_no;

        IF @copy_no IS NULL
            BEGIN
                IF EXISTS (SELECT 1 FROM reservation WHERE member_no = @member_no AND movie_no = @movie_no AND status = 'ACTIVE')
                    THROW 50004, 'Już rezerwujesz ten film!', 1;

                INSERT INTO reservation(member_no, movie_no, reservation_date, status)
                VALUES (@member_no, @movie_no, GETDATE(), 'ACTIVE');

                SELECT 'RESERVATION_CREATED' AS result_status;
                COMMIT TRANSACTION;
                RETURN;
            END

        UPDATE copy SET isAvailable = 0 WHERE copy_no = @copy_no;

        INSERT INTO loan(member_no, copy_no, rent_date, due_date)
        VALUES (@member_no, @copy_no, GETDATE(), DATEADD(DAY, 14, GETDATE()));

        SELECT 'LOAN_CREATED' AS result_status;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
go

CREATE   PROCEDURE sp_return_movie
@loan_no int
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @copy_no int;
    DECLARE @movie_no int;
    DECLARE @waiting_member_no int;
    DECLARE @reservation_no int;

    BEGIN TRANSACTION;
    BEGIN TRY
        SELECT @copy_no = l.copy_no, @movie_no = c.movie_no
        FROM loan l
                 JOIN copy c ON l.copy_no = c.copy_no
        WHERE l.loan_no = @loan_no;

        IF @copy_no IS NULL
            THROW 50002, 'Nie znaleziono wypożyczenia!', 1;

        UPDATE loan SET return_date = GETDATE() WHERE loan_no = @loan_no;

        SELECT TOP 1 @reservation_no = reservation_no, @waiting_member_no = member_no
        FROM reservation
        WHERE movie_no = @movie_no AND status = 'ACTIVE'
        ORDER BY reservation_date ASC;

        IF @reservation_no IS NOT NULL
            BEGIN
                UPDATE reservation SET status = 'COMPLETED' WHERE reservation_no = @reservation_no;

                INSERT INTO loan(member_no, copy_no, rent_date, due_date)
                VALUES (@waiting_member_no, @copy_no, GETDATE(), DATEADD(DAY, 14, GETDATE()));
            END
        ELSE
            BEGIN
                UPDATE copy SET isAvailable = 1 WHERE copy_no = @copy_no;
            END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
go

