create table dbo.member
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

create table dbo.movie
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

create table dbo.copy
(
    copy_no     int identity
        constraint pk_copy
            primary key,
    movie_no    int           not null
        constraint fk_copy_movie
            references dbo.movie,
    isAvailable bit default 1 not null
)
go

create table dbo.loan
(
    loan_no     int identity
        constraint pk_loan
            primary key,
    member_no   int  not null
        constraint fk_loan_member
            references dbo.member,
    copy_no     int  not null
        constraint fk_loan_copy
            references dbo.copy,
    rent_date   date not null,
    due_date    date not null,
    return_date date
)
go

