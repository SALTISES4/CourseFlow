from django.conf import settings


class DynamicInternalIPSMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host_ip = request.META["REMOTE_ADDR"]
        if host_ip not in settings.INTERNAL_IPS:
            settings.INTERNAL_IPS = list(settings.INTERNAL_IPS) + [host_ip]
        response = self.get_response(request)
        return response
