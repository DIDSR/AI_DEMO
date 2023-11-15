# AI DEMO (Data Exploration & Model Optimization)


AI/ML DEMO is an interactive web tool that helps users to explore and gain hands-on-experience in essential concepts in machine learning. This web tool offers feature space and hyperparameter manipulation allowing users to explore various concepts in machine learning including training/test data distribution, under/over fitting, the bias/variance trade-off, neural networks, performance metrics, etc. By interactively engaging with these concepts, non-experts can deepen their understanding and gain practical insights into the world of machine learning.

![Overview](./Figues/Overview.png)

----
Below illustrates some example concepts based on user-selected training/test data points


<p align="center">
Linear Discriminant Analysis (High Bias)

![LDA](./Figues/LDA_all.png)

---


<p align="center">
Neural Network (High Variance)

![DNN](./Figues/MLP_all.png)


---
<p align="center">
Neural Network (Larger Pool of Training Data)

![DNN](./Figues/MLP2_all.png)

---
<p align="center">
Quadratic Discriminant Analysis 

![QDA](./Figues/QDA_all.png)

## Author
Jacob McIntosh

## Requirements
Python 3.10 or higher

## Installation
Ubuntu 18.04
```
1. pip install -r requirements.txt
2. cd src
3. python manage.py collectstatic
4. python manage.py runserver 0.0.0.0:8000
5. Open host ip address:8000 on browser

```