# Here is video
https://youtube.com/watch?v=LB8XvLTMgWc

# Skills
React, Tanstack React Query, TailwindCSS, TypeScript, Zustand, Spring Boot Rest API(Controller-Service-Repository-Entity) and MySQL

# Summary of main features
- For registration and login, the Axios instance defined for communication with the server is sent to the server, and each account is registered through the Rest API or the account is checked and then sent to the screen.
  
- State manage authentication status, tokens for authentication, username, login, logout, etc as the Zustand Store.
  
- On the main screen, using axios.get() and the useQuery hook of the Tanstack React Query to manage loading state, error state, and retrieve the book data state from the Open Library API.
  
- Store authentication information, pagination, and search terms in session storage for security.
  
- In order to manage reviews and replies for each book on the detailed screen, unique IDs were defined, and for communication with the server for registration, modification, and deletion, the Rest API and the Tanstack React Query's useMutation hook and axios's post(), put(), and delete() that call them were coded in an external file.
