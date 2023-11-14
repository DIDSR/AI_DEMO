from django.shortcuts import render
from django.http import JsonResponse

xDataRange = [0,1000]
yDataRange = [0,650]
xPad = 20
yPad = 10


# Create your views here.
def getBounds(request):
    response = JsonResponse({
        'xDataRange' : xDataRange,
        'yDataRange' : yDataRange,
        'xPad' :xPad,
        'yPad': yPad
        }
    )
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Max-Age"] = "1000"
    response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type"

    return response