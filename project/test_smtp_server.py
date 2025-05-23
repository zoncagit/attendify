import smtpd
import asyncore
import threading

class CustomSMTPServer(smtpd.SMTPServer):
    def process_message(self, peer, mailfrom, rcpttos, data, **kwargs):
        print(f'\nReceived message from: {mailfrom}')
        print(f'Recipients: {rcpttos}')
        print('-' * 60)
        print(data.decode())
        print('-' * 60)
        return

def start_smtp_server():
    server = CustomSMTPServer(('localhost', 1025), None)
    print('Starting SMTP server on localhost:1025')
    asyncore.loop()

if __name__ == '__main__':
    # Start the SMTP server in a separate thread
    thread = threading.Thread(target=start_smtp_server)
    thread.daemon = True
    thread.start()
    
    # Keep the main thread alive
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print('\nShutting down SMTP server')
