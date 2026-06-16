# Acoustic-Based Chatter Detection in CNC Milling Using Lightweight Explainable Models

**Authors:** A. Researcher¹, B. Collaborator², C. Supervisor¹
**Affiliations:** ¹TU Dortmund, Institute for Manufacturing Intelligence · ²Lamarr Institute for ML and AI
**Submitted to:** Journal of Intelligent Manufacturing (DEMO — synthetic paper)
**Date:** June 2026

---

## Abstract

We propose a lightweight, explainable machine learning pipeline for real-time chatter detection
in CNC milling processes using raw acoustic emission signals. Unlike prior deep-learning approaches
that require GPU inference, our method achieves 91.4 % F1-score using a gradient-boosted tree
with SHAP explanations, running on embedded hardware at 48 ms latency. We release a reproducible
benchmark dataset of 2,400 labelled milling cycles collected on a DMG MORI DMU 50 machining
centre under controlled spindle-speed and feed-rate conditions. Ablation studies confirm that
temporal statistical features (RMS, kurtosis, crest factor) account for 78 % of model gain over
the baseline. We compare against five baselines including a 1-D CNN and a support vector machine.
All code, data splits, and random seeds are provided.

**Keywords:** chatter detection, CNC milling, acoustic emission, explainable AI, SHAP, embedded ML

---

## 1 Introduction

Machining instability — commonly called *chatter* — causes surface defects, tool wear, and
spindle damage in CNC milling. Early detection is critical for quality control in aerospace and
automotive manufacturing [Smith et al., 2023; Jones & Lee, 2022]. Existing detection systems
rely either on expensive vibration sensors or computationally heavy neural architectures that
cannot run on shop-floor PLCs [Brown, 2021].

This paper addresses three gaps in the literature:

1. **Reproducibility gap.** Prior work rarely releases raw signals or code, making comparison
   unreliable [Chen et al., 2024].
2. **Explainability gap.** Black-box models are rejected by process engineers who need causal
   insight into tool-condition warnings.
3. **Latency gap.** Most published results target offline analysis; real-time deployment
   constraints are underreported.

We contribute: (i) a public dataset with full provenance; (ii) a pipeline whose every
hyperparameter is fixed by a random seed; (iii) SHAP force plots for each prediction.

---

## 2 Related Work

Smith et al. [2023] use a 34-layer ResNet on vibration signals, achieving 94 % accuracy but
requiring 420 ms inference — infeasible for closed-loop control. Jones & Lee [2022] apply
SVM to hand-crafted features; their dataset is not released. Brown [2021] proposes a 1-D CNN
but omits learning-rate schedules and data augmentation details. Chen et al. [2024] achieve
93 % F1 with a transformer but report no hardware latency benchmarks. Our work differs in
combining reproducibility, explainability, and embedded-deployment constraints.

---

## 3 Dataset

We collected acoustic emission (AE) signals from a DMG MORI DMU 50 5-axis machining centre
at TU Dortmund Workshop Hall B. Sampling rate: 500 kHz. Conditions: 6 spindle speeds
(8,000–18,000 RPM, step 2,000), 4 feed rates (100–400 mm/min, step 100), dry and wet cutting,
two tool geometries (4-flute Ø10 mm carbide end mill; 6-flute Ø16 mm HSS).

| Split | Stable cycles | Chatter cycles | Total |
|-------|--------------|----------------|-------|
| Train | 960          | 480            | 1 440 |
| Val   | 240          | 120            | 360   |
| Test  | 480          | 120            | 600   |

Label assignment: an experienced operator labelled each cycle by visual inspection of surface
roughness (Ra < 1.6 µm = stable). Inter-rater agreement with a second operator: κ = 0.91.
Random seed for all splits: **42**. Data available at: `doi:10.5281/zenodo.DEMO-PLACEHOLDER`

---

## 4 Method

### 4.1 Feature Extraction

Each 500 ms AE window is segmented into 50 ms frames. We extract 18 statistical features per
frame: RMS, kurtosis, skewness, crest factor, peak-to-peak, zero-crossing rate, and 12
Mel-frequency cepstral coefficients. Feature matrix shape: (2 400, 18). No normalisation is
applied before tree-based modelling.

### 4.2 Model

We use LightGBM [Ke et al., 2017] with the following fixed hyperparameters:

```python
params = {
    "n_estimators": 300,
    "learning_rate": 0.05,
    "max_depth": 6,
    "num_leaves": 31,
    "min_child_samples": 20,
    "random_state": 42,
    "class_weight": "balanced",
}
```

### 4.3 Explainability

SHAP TreeExplainer produces feature attributions per prediction. We report global importance
rankings and force plots for three representative predictions (stable, chatter, borderline).

---

## 5 Experiments

### 5.1 Baselines

| Model                   | F1 (%)  | Latency (ms) | Parameters |
|-------------------------|---------|--------------|------------|
| Threshold (RMS)         | 71.2    | < 1          | 0          |
| SVM (RBF kernel)        | 83.6    | 2            | —          |
| 1-D CNN (Brown, 2021)   | 88.9    | 210          | 145 K      |
| ResNet-34 (Smith, 2023) | 94.1    | 420          | 21 M       |
| Transformer (Chen, 2024)| 93.4    | 380          | 4.2 M      |
| **Ours (LightGBM)**     | **91.4**| **48**       | —          |

### 5.2 Ablation

Removing kurtosis and crest factor drops F1 to 87.1 %. Removing all temporal features drops
F1 to 79.3 %. Random seed 42 is fixed; we report 5-fold CV mean ± std: **91.4 ± 1.2 %**.

### 5.3 Limitations

Our dataset covers one machine and two tool geometries; generalisation to different spindle
brands and workpiece materials is untested. The labelling protocol relies on Ra measurement,
which may miss subsurface damage. Real-shop deployment requires recalibration to ambient
noise conditions specific to each installation.

---

## 6 Conclusion

We presented a reproducible, explainable, embedded-deployable chatter detection pipeline
achieving 91.4 % F1 at 48 ms latency. We release code and data. Future work will extend
evaluation to five additional machine types.

---

## References

1. Smith, A., Kim, B., & Park, C. (2023). Deep chatter detection. *Int. J. Mach. Tools*, 185, 104012.
2. Jones, D., & Lee, E. (2022). SVM-based milling stability. *Mech. Syst. Signal Process.*, 164, 108258.
3. Brown, F. (2021). 1-D CNN for AE-based chatter. *J. Manuf. Sci. Eng.*, 143(6), 061003.
4. Chen, G., Wang, H., & Liu, J. (2024). Transformer chatter. *Rob. Comput.-Integr. Manuf.*, 86, 102672.
5. Ke, G., et al. (2017). LightGBM. *Advances in NeurIPS*, 30.

---

*DISCLAIMER: This is a synthetic paper for ResearchOS demo purposes only.
All results, authors, datasets, and citations are illustrative.*
