from django.shortcuts import render
from django.http import JsonResponse
import numpy as np
from scipy.special import ndtri
import json
import pandas as pd
import itertools
import sys
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score,precision_score,recall_score,accuracy_score,confusion_matrix, roc_curve
from django.views.decorators.csrf import csrf_exempt
# from sklearn.utils.testing import ignore_warnings
# from sklearn.exceptions import ConvergenceWarning



@csrf_exempt 
def trainModelHandler(request):
     if request.method == "POST":
        body = json.loads(request.body.decode('UTF-8'))
        modelName, dfTrain, dfTest, hyperparams = processBody(body)
        
        if modelName == 'LDA':
            model = LDA(dfTrain)
        elif modelName == 'QDA':
            model = QDA(dfTrain)
        elif modelName == 'RF':
            model = RF(dfTrain)
        elif modelName == 'MLP':
            dfTrain['x'] = (dfTrain['x'] - 500) / 500
            dfTrain['y'] = (dfTrain['y'] - 325) / 325
            dfTest['x'] = (dfTest['x'] - 500) / 500
            dfTest['y'] = (dfTest['y'] - 325) / 325
            model = MLP(dfTrain, **hyperparams)
            # response["Access-Control-Allow-Origin"] = "*"
            # response["Access-Control-Allow-Methods"] = "GET, OPTIONS, POST"
            # response["Access-Control-Max-Age"] = "5000"
            # response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type"
            # return response

        else:
            raise TypeError(f'modelName not defined; got {modelName}')

        metrics = evaluate(model, dfTrain, dfTest, modelName)
        
        response = JsonResponse({
            'surface': getNNDecisionSurface(model, metrics['threshold']) if modelName == "MLP" else getDecisionSurface(model),
            'metrics': metrics
            }
        )
        response["Access-Control-Allow-Origin"] = "*"
        response["Access-Control-Allow-Methods"] = "GET, OPTIONS, POST"
        response["Access-Control-Max-Age"] = "1000"
        response["Access-Control-Allow-Headers"] = "X-Requested-With, Content-Type"
        return response


def processBody(body):
    modelName = body['model']
    trainTrue = pd.DataFrame(body['posTrainData'])
    trainFalse = pd.DataFrame(body['negTrainData'])
    testTrue = pd.DataFrame(body['posTestData'])
    testFalse = pd.DataFrame(body['negTestData'])
    hyperparams = {}

    trainTrue['z'] = 1
    trainFalse['z'] = 0
    testTrue['z'] = 1
    testFalse['z'] = 0

    dfTrain = pd.concat([trainTrue, trainFalse])
    dfTest = pd.concat([testTrue, testFalse])

    if 'learning_rate' in body:
        hyperparams['learning_rate_init'] = body['learning_rate']
        hyperparams['max_iter'] = body['EPOCHS']
        hyperparams['hidden_layer_sizes'] = tuple([body['nodes_per_layer']] * body['num_layers'])

    return modelName, dfTrain, dfTest, hyperparams

def LDA(dfTrain):
    model = LinearDiscriminantAnalysis()
    model.fit(dfTrain[['x','y']], dfTrain['z'])
    return model

def QDA(dfTrain):
    model = QuadraticDiscriminantAnalysis()
    model.fit(dfTrain[['x','y']], dfTrain['z'])
    return model

def RF(dfTrain):
    model = RandomForestClassifier(max_depth = 3)
    model.fit(dfTrain[['x','y']], dfTrain['z'])
    return model

# @ignore_warnings(category=ConvergenceWarning)
def MLP(dfTrain, **kwargs):
    model = MLPClassifier(shuffle= True, random_state= 42, alpha=0, n_iter_no_change = 100, **kwargs )#max_iter=1, shuffle= True, hidden_layer_sizes= (16,32,64,128,64,32,16), learning_rate_init = 0.05)
    model.fit(dfTrain[['x','y']], dfTrain['z'])
    return model
    # model.partial_fit(dfTrain[['x','y']].iloc[:1], dfTrain['z'].iloc[:1], classes = [0,1])
    # dsurface = [getNNDecisionSurface(model)]
    # for i in range(50):
    #     model.partial_fit(dfTrain[['x','y']], dfTrain['z'])
    #     if i < 5 or i%5 == 4:
    #         dsurface.append(getNNDecisionSurface(model))
    # response = JsonResponse(
    # {
    #     'surface': dsurface,
    #     'metrics': evaluate(model, dfTrain, dfTest)
    #     }
    # )
    # return response

def LR(dfTrain):
    model = LogisticRegression()
    model.fit(dfTrain[['x','y']], dfTrain['z'])
    return model

def logLikelihoodToProb(arr):

    arr -= np.max(arr)

    arr = np.exp(arr)
    return arr/(arr + 1)


def evaluate(model, dfTrain, dfTest, modelName, alpha = 0.95):


    trainProbs = model.predict_proba(dfTrain[['x','y']])[:,list(model.classes_).index(1)] if isinstance(model, (MLPClassifier,RandomForestClassifier)) else logLikelihoodToProb(model.decision_function(dfTrain[['x','y']]))
    testProbs = model.predict_proba(dfTest[['x','y']])[:,list(model.classes_).index(1)] if isinstance(model, (MLPClassifier,RandomForestClassifier)) else logLikelihoodToProb(model.decision_function(dfTest[['x','y']]))
    trainActual = dfTrain['z'].to_numpy()
    testActual = dfTest['z'].to_numpy()
    threshold = 0.5


    if isinstance(model, MLPClassifier):
        fprTrain, tprTrain, thresholds = roc_curve(trainActual, trainProbs)
        gmean = np.sqrt(tprTrain * (1 - fprTrain))
        idx = np.argmax(gmean)
        threshold = thresholds[idx]
        trainPreds = np.zeros_like(trainProbs)
        testPreds = np.zeros_like(testProbs)

        trainPreds[trainProbs >= threshold] = 1
        testPreds[testProbs >= threshold] = 1
    else:
        trainPreds = model.predict(dfTrain[['x','y']])
        testPreds = model.predict(dfTest[['x','y']])

    trainProbstrue = trainProbs[dfTrain['z'] == 1]
    trainProbsfalse = trainProbs[dfTrain['z'] == 0]
    testProbstrue = testProbs[dfTest['z'] == 1]
    testProbsfalse = testProbs[dfTest['z'] == 0]

    trainAUC, trainAUCCI = AUC_CI(trainProbstrue, trainProbsfalse)
    testAUC, testAUCCI = AUC_CI(testProbstrue, testProbsfalse)

    trainCM = confusion_matrix(trainActual,trainPreds)
    testCM = confusion_matrix(testActual,testPreds)

    fprTrain, tprTrain, thresholds = roc_curve(trainActual, trainProbs)
    fprTest, tprTest, thresholds = roc_curve(testActual, testProbs)


    trainTN, trainFP, trainFN, trainTP = trainCM.ravel()
    testTN, testFP, testFN, testTP = testCM.ravel()

    z = -ndtri((1.0-alpha)/2)



    return {
        'trainF1' : f1_score(trainActual,trainPreds),
        'testF1' : f1_score(testActual,testPreds),
        'trainSpecificity' : trainTN/(trainTN + trainFP+ 0.00000001),
        'testSpecificity' : testTN/(testTN + testFP + 0.00000001),
        'trainSpecificityCI' : proportion_confidence_interval(trainTN, trainTN + trainFP, z),
        'testSpecificityCI' : proportion_confidence_interval(testTN, testTN + testFP, z),
        'trainSensitivity' : recall_score(trainActual,trainPreds),
        'testSensitivity' : recall_score(testActual,testPreds),
        'trainSensitivityCI' : proportion_confidence_interval(trainTP, trainTP + trainFN, z),
        'testSensitivityCI' : proportion_confidence_interval(testTP, testTP + testFN, z),
        'trainAcc' : accuracy_score(trainActual,trainPreds),
        'testAcc' : accuracy_score(testActual,testPreds),
        'trainCM' : confusion_matrix(trainActual,trainPreds).tolist(),
        'testCM' : confusion_matrix(testActual,testPreds).tolist(),
        'trainROC' : [{'fpr': f, 'tpr': t} for f,t in zip(fprTrain,tprTrain)],
        'testROC' : [{'fpr': f, 'tpr': t} for f,t in zip(fprTest,tprTest)],
        'trainAUC' : trainAUC,
        'testAUC' : testAUC,
        'testAUCCI' : testAUCCI,
        'threshold' : threshold

    }

    
def getDecisionSurface(model):
    tmp = pd.DataFrame(list(itertools.product(range(650), range(1000))), columns= ['y','x'])
    tmp = tmp[['x','y']]
    return model.predict(tmp).tolist()


def getNNDecisionSurface(model, threshold = 0.5):
    tmp = pd.DataFrame(list(itertools.product(np.linspace(-1,1,650), np.linspace(-1,1,1000))), columns= ['y','x'])
    tmp = tmp[['x','y']]
    probs = model.predict_proba(tmp)[:,list(model.classes_).index(1)]
    surf = np.zeros_like(probs, dtype = np.uint8)
    surf[probs >= threshold] = 1
    return surf.tolist()
    #return model._predict(tmp).tolist()


def proportion_confidence_interval(r, n, z):
    # https://gist.github.com/maidens/29939b3383a5e57935491303cf0d8e0b
    
    if n == 0:
        return (0,0)
    A = 2*r + z**2
    B = z*np.sqrt(z**2 + 4*r*(1 - r/n))
    C = 2*(n + z**2)
    return (np.clip((A-B)/C, 0.0, 1.0), np.clip((A+B)/C, 0.0,1.0))

def kernel(t,f):
    return (np.sign(t-f)+1)/2

def AUC_CI(t,f):
    m,n = len(t),len(f)
    X = kernel(t, f[:,None])

    MSf = m * np.var(np.mean(X,1), ddof=1)
    MSt = n * np.var(np.mean(X,0), ddof=1)
    TMS = np.var(X, ddof=1)
    ev = ((n*m-1)*TMS - (n-1)*MSf - (m-1)*MSt)/((n-1)*(m-1))
    AUC = np.mean(X)
    var = (MSf+MSt-ev)/(m*n)
    return AUC, (np.clip(AUC-1.96*np.sqrt(var),0.0,1.0), np.clip(AUC+1.96*np.sqrt(var), 0.0, 1.0))

