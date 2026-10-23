// SPDX-License-Identifier: Apache-2.0
// VoxelRealmsGuardrails.hpp — C++20 RAII Smart-Pointer & Concept Guardrail Header

#pragma once

#include <cmath>
#include <concepts>
#include <cstdint>
#include <memory>
#include <string_view>
#include <vector>

namespace voxel::guardrails {

enum class CultivationRealm : uint8_t {
    QiRefinement = 0,
    FoundationEstablishment = 1,
    GoldenCore = 2,
    NascentSoul = 3,
    DaoCreator = 21,
};

template <typename T>
concept CultivatorEntity = requires(const T& entity) {
    { entity.getRealm() } -> std::convertible_to<CultivationRealm>;
    { entity.getKarmaScore() } -> std::convertible_to<int32_t>;
};

[[nodiscard]] constexpr double computeRealmSuppressionMultiplier(CultivationRealm attacker,
                                                                 CultivationRealm defender) noexcept {
    const int32_t delta = static_cast<int32_t>(attacker) - static_cast<int32_t>(defender);
    if (delta == 0) {
        return 1.0;
    }
    double multiplier = 1.0;
    const int32_t absDelta = delta > 0 ? delta : -delta;
    for (int32_t step = 0; step < absDelta; ++step) {
        multiplier *= 10.0;
    }
    return delta > 0 ? multiplier : (1.0 / multiplier);
}

static_assert(computeRealmSuppressionMultiplier(CultivationRealm::GoldenCore,
                                                CultivationRealm::QiRefinement) == 100.0,
              "Golden Core (2) vs Qi Refinement (0) must deal 100.0x damage");

class CultivatorNode final {
  public:
    explicit CultivatorNode(std::string_view cultivatorName, CultivationRealm initialRealm,
                            int32_t initialKarma) noexcept
        : name(cultivatorName), realm(initialRealm), karmaScore(initialKarma) {}

    [[nodiscard]] CultivationRealm getRealm() const noexcept { return realm; }
    [[nodiscard]] int32_t getKarmaScore() const noexcept { return karmaScore; }
    [[nodiscard]] std::string_view getName() const noexcept { return name; }

  private:
    std::string_view name;
    CultivationRealm realm;
    int32_t karmaScore;
};

class SectHierarchyManager final {
  public:
    SectHierarchyManager() = default;

    void registerMaster(std::shared_ptr<CultivatorNode> masterNode) noexcept {
        sectMaster = std::move(masterNode);
    }

    void enrollDisciple(std::string_view discipleName, CultivationRealm realm) {
        disciples.push_back(std::make_unique<CultivatorNode>(discipleName, realm, 0));
    }

    [[nodiscard]] std::size_t getDiscipleCount() const noexcept { return disciples.size(); }

    [[nodiscard]] bool hasActiveMaster() const noexcept { return sectMaster != nullptr; }

  private:
    std::shared_ptr<CultivatorNode> sectMaster;
    std::vector<std::unique_ptr<CultivatorNode>> disciples;
};

} // namespace voxel::guardrails
