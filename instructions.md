1. mkdir venv
2. python3 -m venv ./venv
3. venv\Scripts\activate
4. pip install -r requirements.txt
5. cd src
6. python manage.py collectstatic
7. python manage.py runserver 0.0.0.0:8000
8. Open *host ip address*:8000 on browser
