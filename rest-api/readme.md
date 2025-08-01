### Installation

- [Docker](https://docs.docker.com/engine/install/)
- [Mysqlsh](https://dev.mysql.com/doc/mysql-shell/8.0/en/mysql-shell-install.html)

### Launch MySQL using Docker

```
docker run --detach --env MYSQL_ROOT_PASSWORD=dummypassword --env MYSQL_USER=todos-user --env MYSQL_PASSWORD=dummytodos --env MYSQL_DATABASE=todos --name mysql --publish 3306:3306 mysql:8-oracle
```

### /build.gradle Modified

```
// Use the below Mysql Dependency Starting from SB 3.1.x
plugins {
	id 'org.springframework.boot' version '3.2.1'
	id 'io.spring.dependency-management' version '1.0.15.RELEASE'
	id 'java'
}
```

### /src/main/resources/application.properties Modified

```

#comment-h2
#spring.datasource.url=jdbc:h2:mem:testdb

spring.datasource.url=jdbc:mysql://localhost:3306/todos
spring.datasource.username=todos-user
spring.datasource.password=dummytodos
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.hibernate.ddl-auto=update
```