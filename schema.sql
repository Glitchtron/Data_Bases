create table member
(
    member_no int identity
        constraint pk_member
            primary key,
    firstname nvarchar(50)  not null,
    lastname  nvarchar(50)  not null,
    email     nvarchar(100) not null
        constraint uq_member_email
            unique
)
go

create table movie
(
    movie_no int identity
        constraint pk_movie
            primary key,
    title    nvarchar(50) not null
        constraint uq_movie_title
            unique,
    genre    nvarchar(50) not null,
    synopsis nvarchar(100)
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
           sum(case when c.isAvailable = 1 then 1 else 0 end) as available_copies,
           count(c.copy_no) as total_copies
from movie m
left join dbo.copy c on m.movie_no = c.movie_no
group by
    m.movie_no, m.title, m.genre, m.synopsis
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

CREATE   PROCEDURE p_rent_movie
    @member_no int,
    @movie_no int
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @copy_no int;

    BEGIN TRANSACTION;

    BEGIN TRY

        SELECT TOP 1 @copy_no = copy_no
        FROM copy WITH (UPDLOCK, ROWLOCK)
        WHERE movie_no = @movie_no
          AND isAvailable = 1;

        IF @copy_no IS NULL
            THROW 50001, 'No available copy', 1;

        UPDATE copy
        SET isAvailable = 0
        WHERE copy_no = @copy_no;

        INSERT INTO loan(member_no, copy_no, rent_date, due_date)
        VALUES (@member_no, @copy_no, GETDATE(), DATEADD(DAY, 14, GETDATE()));

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

    BEGIN TRANSACTION;

    BEGIN TRY

        SELECT @copy_no = copy_no
        FROM loan
        WHERE loan_no = @loan_no;

        IF @copy_no IS NULL
            THROW 50002, 'Loan not found', 1;

        UPDATE loan
        SET return_date = GETDATE()
        WHERE loan_no = @loan_no;

        UPDATE copy
        SET isAvailable = 1
        WHERE copy_no = @copy_no;

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
go

