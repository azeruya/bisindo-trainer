BISINDO v1 evaluation

Labels:
A B C D E F P T + no_sign

Features:
132 normalized MediaPipe landmark features

Development:
s01, s02
Validation:
s03

Selected:
MLPClassifier
hidden layers: 128, 64
confidence threshold: 0.60

Final unseen signer:
Train: s01 + s02 + s03
Test: s04

Final result:
Frame accuracy: 94.82%
Macro F1: 0.944
Valid-sign recall: 93.00%
NO_SIGN false accept: 0.34%
Attempt accuracy: 52/55 = 94.55%