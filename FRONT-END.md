```mermaid
flowchart TB
    %% Entry Points
    Home[Home Page]
    Login[Login Page]
    Signup[Signup Page]

    %% Dashboards
    AdminDash[Admin Dashboard]
    CustomerDash[Customer Dashboard]

    %% Admin Components
    AdminProducts[Manage Products]
    AdminOrders[Manage Orders]
    AdminCustomers[Manage Customers]

    %% Customer Components
    ProductList[Product List]
    Cart[Shopping Cart]
    CustomerProfile[Customer Profile]

    %% Navigation Flow
    Home --> Login
    Home --> Signup
    Signup --> AdminDash
    Signup --> CustomerDash
    Login --> AdminDash
    Login --> CustomerDash

    %% Admin Dashboard Navigation
    AdminDash --> AdminProducts
    AdminDash --> AdminOrders
    AdminDash --> AdminCustomers

    %% Customer Dashboard Navigation
    CustomerDash --> ProductList
    CustomerDash --> Cart
    CustomerDash --> CustomerProfile

    %% Product Browsing and Cart
    ProductList --> Cart
    Cart --> ProductList
```