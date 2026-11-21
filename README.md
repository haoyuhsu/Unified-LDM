# UNIFIED: Single-Transformer Latent Diffusion

[Hao-Yu Hsu](https://haoyuhsu.github.io/), [Shenlong Wang](https://shenlong.web.illinois.edu/), [Alexander G. Schwing](https://www.alexander-schwing.de/)

University of Illinois Urbana-Champaign

[**Project Page**](https://haoyuhsu.github.io/Unified-LDM/) | **Paper** (coming soon)

![UNIFIED samples on ImageNet-1K 256×256](https://haoyuhsu.github.io/Unified-LDM/static/img/hero_mosaic.jpg)

UNIFIED encodes, generates, and decodes images with **one diffusion transformer**. Every backbone weight is shared, and the model trains in a single stage with reconstruction and flow matching, without DINO or GAN supervision.

## Highlights

- **One network instead of three.** Encoder, generator, and decoder share one set of backbone weights; only 1.63% of parameters are mode-specific.
- **Better at every matched size.** On ImageNet-1K 256×256, UNIFIED improves gFID over UNITE at about 60M, 115M, and 215M parameters, reaching **gFID 2.08 with 215M parameters**.
- **Text-to-image from scratch.** No pretrained VAE: UNIFIED-B (218M) reaches **GenEval 0.87** at 512×512.

## Results

Class-conditional ImageNet-1K 256×256, 200 epochs, same parameter budget and training recipe.

| Size  | Method   | Params | gFID ↓   | IS ↑      | rFID ↓   |
| ----- | -------- | -----: | -------: | --------: | -------: |
| Tiny  | UNITE    |    61M |     3.00 |     272.4 |     1.27 |
|       | UNIFIED  |    62M | **2.78** | **280.1** |     1.75 |
| Small | Separate |   113M |     5.17 |     244.8 |     1.64 |
|       | UNITE    |   117M |     2.76 |     283.9 |     1.13 |
|       | UNIFIED  |   116M | **2.43** | **295.9** | **1.04** |
| Base  | Separate |   222M |     3.96 |     267.7 |     1.38 |
|       | UNITE    |   217M |     2.23 |     282.1 |     1.41 |
|       | UNIFIED  |   215M | **2.08** | **314.4** | **0.95** |

See the [project page](https://haoyuhsu.github.io/Unified-LDM/) for the design path, compute comparisons, and text-to-image results.

## Code

Code and pretrained checkpoints will be released here. Stay tuned.

## Citation

```bibtex
@article{hsu2026unified,
  title   = {Single-Transformer Latent Diffusion},
  author  = {Hsu, Hao-Yu and Wang, Shenlong and Schwing, Alexander G},
  journal = {Under review},
  year    = {2026}
}
```
