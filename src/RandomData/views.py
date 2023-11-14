from django.shortcuts import render
from django.http import JsonResponse
import numpy as np
import json
from django.views.decorators.csrf import csrf_exempt
import os



# Create your views here.

def test(request):
    response = JsonResponse({'foo':'bar', 'foo2': np.random.random()})
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Max-Age"] = "1000"
    response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type"
    return response

@csrf_exempt 
def generateData(request):
    if request.method == "POST":
        
        body = json.loads(request.body.decode('UTF-8'))

        # if cov matrices and mus are not none
        if body['covTrue'] != None:
            covTrue = np.array(body['covTrue'])
            covFalse = np.array(body['covFalse'])
            muTrue = body['muTrue']
            muFalse = body['muFalse']

        else:
            covTrue = np.array(
                [
                    [np.random.uniform(40,70), np.random.normal(0, 10)],
                    [np.random.uniform(0,20), np.random.uniform(30,60)]
                ]
            )
            covFalse = np.array(
                [
                    [np.random.uniform(40,70), np.random.normal(0, 10)],
                    [np.random.uniform(0,20), np.random.uniform(30,60)]
                ]
            )
            covTrue[1][0] = covTrue[0][1]
            covFalse[1][0] = covFalse[0][1]

            covTrue = np.dot(covTrue, covTrue.transpose())
            covFalse = np.dot(covFalse, covFalse.transpose())

            if np.random.random() < 0.5:
                covTrue[1][0] *= -1
                covTrue[0][1] *= -1

            if np.random.random() < 0.5:
                covFalse[1][0] *= -1
                covFalse[0][1] *= -1

            muTrue = [np.random.uniform(200,800), np.random.uniform(250,400)]
            muFalse = [np.random.uniform(200,800), np.random.uniform(250,400)]

        

        dTrueTrain = np.random.multivariate_normal(muTrue, covTrue, int(body['TrainPosSlider']))
        dTrueTest = np.random.multivariate_normal(muTrue, covTrue, int(body['TestPosSlider']))
        dFalseTrain = np.random.multivariate_normal(muFalse, covFalse, int(body['TrainNegSlider']))
        dFalseTest = np.random.multivariate_normal(muFalse, covFalse, int(body['TestNegSlider']))

        np.clip(dTrueTrain[:,0], 21, 979, out = dTrueTrain[:,0])
        np.clip(dTrueTest[:,0], 21, 979, out = dTrueTest[:,0])
        np.clip(dFalseTrain[:,0], 21, 979, out = dFalseTrain[:,0])
        np.clip(dFalseTest[:,0], 21, 979, out = dFalseTest[:,0])

        np.clip(dTrueTrain[:,1], 11, 639, out = dTrueTrain[:,1])
        np.clip(dTrueTest[:,1], 11, 639, out = dTrueTest[:,1])
        np.clip(dFalseTrain[:,1], 11, 639, out = dFalseTrain[:,1])
        np.clip(dFalseTest[:,1], 11, 639, out = dFalseTest[:,1])

        response = JsonResponse(
            {
                'TrainPosSlider': [{'x': arr[0], 'y': arr[1]} for arr in dTrueTrain],
                'TestPosSlider' : [{'x': arr[0], 'y': arr[1]} for arr in dTrueTest],
                'TrainNegSlider' : [{'x': arr[0], 'y': arr[1]} for arr in dFalseTrain],
                'TestNegSlider' : [{'x': arr[0], 'y': arr[1]} for arr in dFalseTest],
                'covTrue' : covTrue.tolist(),
                'covFalse' : covFalse.tolist(),
                'muTrue' :  muTrue,
                'muFalse' : muFalse
            }
        )
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS, POST"
        response["Access-Control-Max-Age"] = "1000"
        response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type"

        return response