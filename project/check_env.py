print("Script démarré")

try:
    from dotenv import load_dotenv
    import os

    load_dotenv()

    vars_to_check = [
        "SMTP_SERVER",
        "SMTP_PORT",
        "SMTP_USER",
        "SMTP_PASSWORD",
        "EMAIL_FROM",
        "EMAIL_FROM_NAME",
    ]

    print("=== Vérification des variables d'environnement ===")
    for var in vars_to_check:
        value = os.getenv(var)
        if value:
            print(f"{var} = {value}")
        else:
            print(f"{var} ❌ NON DÉFINIE")
except Exception as e:
    print(f"Erreur pendant l'exécution : {e}")
